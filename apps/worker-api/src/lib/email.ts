import { connect } from 'cloudflare:sockets'
import { Env } from '../types'

const enc = new TextEncoder()
const b64 = (value: string) => btoa(value)

/**
 * Sends one email over a raw SMTP connection via `cloudflare:sockets` — no
 * third-party email API/SDK, just SMTP itself (AUTH PLAIN, then the usual
 * MAIL FROM / RCPT TO / DATA sequence) so it works from a Worker.
 */
export async function sendEmail(env: Env, { to, subject, text, html }: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const username = env.SMTP_USERNAME
  const password = env.SMTP_PASSWORD
  if (!username || !password) throw new Error('Email is not configured — SMTP_USERNAME or SMTP_PASSWORD missing')
  // Defense-in-depth: a recipient with whitespace/control chars could smuggle
  // SMTP commands or extra headers — refuse outright rather than sanitize.
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(to || ''))) {
    throw new Error('Refusing to send: invalid recipient address')
  }

  const socket = connect(
    { hostname: env.SMTP_HOST || 'smtp.gmail.com', port: Number(env.SMTP_PORT || 465) },
    { secureTransport: 'on', allowHalfOpen: false },
  )
  const reader = socket.readable.getReader()
  const writer = socket.writable.getWriter()
  const decoder = new TextDecoder()
  let buffered = ''

  async function response(expected: number[]) {
    while (true) {
      const lines = buffered.split('\r\n')
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) {
          const code = Number(lines[i].slice(0, 3))
          buffered = lines.slice(i + 1).join('\r\n')
          if (!expected.includes(code)) throw new Error(`SMTP rejected request (${code})`)
          return
        }
      }
      const chunk = await reader.read()
      if (chunk.done) throw new Error('SMTP connection closed unexpectedly')
      buffered += decoder.decode(chunk.value, { stream: true })
    }
  }

  const command = async (cmdText: string, expected: number[]) => {
    await writer.write(enc.encode(`${cmdText}\r\n`))
    await response(expected)
  }

  const fromName = env.EMAIL_FROM_NAME || 'QeSuite'
  const boundary = `qesuite-${crypto.randomUUID()}`
  const message = [
    `From: ${fromName} <${username}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    `--${boundary}--`,
    '',
  ].join('\r\n').replace(/^\./gm, '..')

  try {
    await response([220])
    await command('EHLO qesuite.com', [250])
    await command(`AUTH PLAIN ${b64(`\0${username}\0${password}`)}`, [235])
    await command(`MAIL FROM:<${username}>`, [250])
    await command(`RCPT TO:<${to}>`, [250, 251])
    await command('DATA', [354])
    await command(`${message}\r\n.`, [250])
    await command('QUIT', [221])
  } finally {
    try { writer.releaseLock(); reader.releaseLock(); socket.close() } catch { /* best-effort cleanup */ }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] ?? c))
}

/**
 * Branded owner-alert email layout — table-based HTML (survives Outlook/
 * Gmail clipping), styled with the store's own name and primary color so
 * an alert about *their* store looks like it came from their store, not
 * from the QeSuite platform.
 */
export function renderOwnerAlertEmail(input: { storeName: string; primaryColorHex?: string | null; heading: string; lead: string; actionUrl: string; actionLabel: string }): string {
  const accent = input.primaryColorHex && /^#[0-9a-fA-F]{6}$/.test(input.primaryColorHex) ? input.primaryColorHex : '#0d9488'
  const storeName = escapeHtml(input.storeName)
  const heading = escapeHtml(input.heading)
  const lead = escapeHtml(input.lead)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f4;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f4;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;">
        <tr><td style="background:${accent};border-radius:14px 14px 0 0;padding:20px 28px;">
          <span style="font-family:'Segoe UI',system-ui,Arial,sans-serif;font-size:18px;font-weight:800;color:#ffffff;">${storeName}</span>
        </td></tr>
        <tr><td style="background:#ffffff;padding:30px 28px 26px;">
          <h1 style="margin:0 0 12px;font-family:'Segoe UI',system-ui,Arial,sans-serif;font-size:19px;font-weight:800;color:#0f172a;">${heading}</h1>
          <p style="margin:0 0 22px;font-family:'Segoe UI',system-ui,Arial,sans-serif;font-size:14px;color:#334155;line-height:1.6;">${lead}</p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:${accent};border-radius:10px;">
              <a href="${input.actionUrl}" style="display:inline-block;padding:12px 24px;font-family:'Segoe UI',system-ui,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(input.actionLabel)}</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#eef4f3;border-radius:0 0 14px 14px;padding:16px 28px;">
          <p style="margin:0;font-family:'Segoe UI',system-ui,Arial,sans-serif;font-size:11.5px;color:#64748a;">Sent by your Store dashboard notifications.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
