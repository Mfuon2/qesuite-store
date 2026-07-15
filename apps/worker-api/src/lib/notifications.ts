import { Env } from '../types'

/**
 * Normalize any Kenyan phone input to 254XXXXXXXXX (no + sign).
 *
 * Handles all common input forms:
 *   724814117   → 254724814117   (9-digit, 7-prefix, no leading 0)
 *   0724814117  → 254724814117   (10-digit, leading 0)
 *   1124814117  → 2541124814117  (10-digit, 1-prefix, no leading 0)
 *   01124814117 → 2541124814117  (11-digit, leading 0 on 1-prefix)
 *   +254724…    → 254724…        (already international, strip +)
 *   254724…     → 254724…        (already normalized)
 */
export function normalizeKenyaPhone(phone: string): string {
  // Strip every non-digit character (spaces, +, dashes, parens, dots)
  let d = phone.replace(/\D/g, '')

  // Already has country code
  if (d.startsWith('254')) return d

  // Strip any number of leading zeros, then prepend 254
  d = d.replace(/^0+/, '')
  return '254' + d
}

/**
 * Send an SMS via TextSMS Kenya.
 * Docs: https://sms.textsms.co.ke/api/services/sendsms/
 * Auth: credentials in POST body (no Authorization header)
 */
export async function sendSMS(env: Env, phone: string, message: string): Promise<void> {
  if (!env.SMS_API_KEY || !env.SMS_PARTNER_ID) {
    // Throw so callers log this as 'failed' instead of silently recording 'sent'
    throw new Error('SMS not configured — SMS_API_KEY or SMS_PARTNER_ID missing')
  }

  const mobile = normalizeKenyaPhone(phone)

  const url = (env.SMS_BASE_URL ?? 'https://sms.textsms.co.ke/api/services/sendsms/').replace(/\/?$/, '/')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      apikey: env.SMS_API_KEY,
      partnerID: env.SMS_PARTNER_ID,
      message,
      shortcode: env.SMS_SHORTCODE,
      mobile,
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => String(response.status))
    console.error(`TextSMS HTTP error [${response.status}]:`, err)
    throw new Error(`SMS delivery failed (${response.status})`)
  }

  // TextSMS wraps results in a responses array.
  // Note their API typo: "respose-code" (missing 'n'). Code may arrive as number or string.
  const result = await response.json() as {
    responses?: Array<{ 'respose-code': number | string; 'response-description': string; messageid?: number }>
  }
  const first = result.responses?.[0]

  if (first) {
    const code = String(first['respose-code'])
    const desc = (first['response-description'] ?? '').toLowerCase()
    const isSuccess = code === '200' || desc.includes('success')

    if (!isSuccess) {
      console.error(`TextSMS rejected SMS: code=${code}, description=${first['response-description']}`)
      throw new Error(`SMS rejected by provider: ${first['response-description']}`)
    }

    console.info(`SMS delivered via TextSMS — code: ${code}, messageId: ${first.messageid ?? '?'}, mobile: ${mobile}`)
  } else {
    // No responses array — log raw result and assume success if HTTP was OK
    console.warn('TextSMS response had no responses array:', JSON.stringify(result))
  }
}

export async function sendWhatsApp(env: Env, phone: string, message: string): Promise<void> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
    throw new Error('WhatsApp not configured — WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing')
  }
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizeKenyaPhone(phone),
        type: 'text',
        text: { body: message },
      }),
    }
  )
  if (!response.ok) {
    const err = await response.text()
    console.error('WhatsApp send failed:', err)
    throw new Error(`WhatsApp delivery failed (${response.status})`)
  }
}

// ── Order SMS templates (English) ─────────────────────────────

/** Sent to the customer immediately after an order is placed. */
export function getOrderConfirmedSMS(
  code: string,
  total: number,
  method: string,
  slug: string,
  storeName: string,
  baseUrl: string
): string {
  const payLabel = method === 'mpesa' ? 'M-Pesa' : method === 'pay_on_delivery' ? 'Pay on Delivery' : 'Card'
  return `Hi! Your order #${code} from ${storeName} has been received.\nTotal: KES ${total.toLocaleString()} | Payment: ${payLabel}\nTrack your order: ${baseUrl}/${slug}/track/${code}`
}

/** Sent to the customer when their order is dispatched. Rider details included when known. */
export function getOutForDeliverySMS(
  code: string,
  riderName: string | null | undefined,
  riderPhone: string | null | undefined,
  slug: string,
  baseUrl: string
): string {
  const riderLine = riderName ? `\nRider: ${riderName}${riderPhone ? ` | Call: ${riderPhone}` : ''}` : ''
  return `Great news! Your order #${code} is on its way.${riderLine}\nTrack live: ${baseUrl}/${slug}/track/${code}`
}

/** Sent to the customer when their order has been delivered. */
export function getDeliveredSMS(code: string, storeName: string): string {
  return `Your order #${code} has been delivered. Thank you for shopping with ${storeName}! We hope to serve you again.`
}

/** Sent to the store owner when a new order comes in. */
export function getNewOrderSMS(
  code: string,
  customerName: string,
  total: number,
  method: string,
  dashboardUrl: string
): string {
  const payLabel = method === 'mpesa' ? 'M-Pesa' : method === 'pay_on_delivery' ? 'Pay on Delivery' : 'Card'
  return `New order #${code}! Customer: ${customerName} | Total: KES ${total.toLocaleString()} | ${payLabel}\nManage: ${dashboardUrl}`
}
