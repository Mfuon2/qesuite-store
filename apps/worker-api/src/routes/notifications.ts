import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId } from '../lib/jwt'
import { sendSMS } from '../lib/notifications'

const notifications = new Hono<{ Bindings: Env; Variables: Variables }>()

notifications.use('*', authMiddleware, tenantGuard, requireModule('notifications'))

// GET /api/notifications — list all notifications for the tenant
notifications.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const status = c.req.query('status') // queued | sent | failed
    const channel = c.req.query('channel') // sms | whatsapp
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10))
    const limit = Math.min(parseInt(c.req.query('limit') ?? '25', 10), 100)
    const offset = (page - 1) * limit

    const conditions = ['n.tenant_id = ?']
    const params: (string | number)[] = [tenantId]

    if (status) { conditions.push('n.status = ?'); params.push(status) }
    if (channel) { conditions.push('n.channel = ?'); params.push(channel) }

    const where = conditions.join(' AND ')

    const countRow = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM notifications_log n WHERE ${where}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT n.id, n.order_id, n.channel, n.recipient, n.message, n.status, n.sent_at,
              o.tracking_code
       FROM notifications_log n
       LEFT JOIN orders o ON o.id = n.order_id
       WHERE ${where}
       ORDER BY n.sent_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: rows.results,
      meta: {
        total: countRow?.cnt ?? 0,
        page,
        limit,
        total_pages: Math.ceil((countRow?.cnt ?? 0) / limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('notifications list error', err)
    return c.json({ success: false, error: 'Failed to fetch notifications', data: null }, 500)
  }
})

// POST /api/notifications/:id/send — send / resend any notification (queued, failed, or sent)
notifications.post('/:id/send', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')

    const notif = await c.env.qesuite_db.prepare(
      'SELECT * FROM notifications_log WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{
      id: string; tenant_id: string; order_id: string | null
      channel: string; recipient: string; message: string; status: string
    }>()

    if (!notif) return c.json({ success: false, error: 'Notification not found', data: null }, 404)
    if (notif.channel !== 'sms') {
      return c.json({ success: false, error: 'Send/resend only supported for SMS', data: null }, 400)
    }

    // Resolve the actual message text
    /** Strip ALL internal log prefixes — these must never reach the customer */
    function cleanMessage(raw: string): string {
      return raw.replace(/^(\[(RESEND|QUEUED[^[\]]*SEND)\]\s*)+/gi, '').trim()
    }

    let messageText: string | null = null

    if (!notif.message.startsWith('{')) {
      // Real SMS message — strip every stacked prefix before sending
      messageText = cleanMessage(notif.message)
    } else {
      // Queued metadata entry — look for the corresponding actual message for this order
      if (notif.order_id) {
        const actual = await c.env.qesuite_db.prepare(
          `SELECT message FROM notifications_log
           WHERE order_id = ? AND tenant_id = ? AND channel = 'sms'
             AND message NOT LIKE '{%'
           ORDER BY sent_at DESC LIMIT 1`
        ).bind(notif.order_id, tenantId).first<{ message: string }>()
        if (actual?.message) messageText = cleanMessage(actual.message)
      }

      // If still no message, reconstruct a generic one from metadata
      if (!messageText) {
        try {
          const meta = JSON.parse(notif.message) as { type?: string; tracking_code?: string }
          messageText = `QeSuite: Notification for order #${meta.tracking_code ?? 'N/A'} (${meta.type ?? 'update'}). Please check your order status.`
        } catch {
          return c.json({ success: false, error: 'Cannot determine message content for this queue record', data: null }, 400)
        }
      }
    }

    // Send via Beem Africa
    let newStatus: 'sent' | 'failed' = 'failed'
    try {
      await sendSMS(c.env, notif.recipient, messageText)
      newStatus = 'sent'
    } catch { /* logged inside sendSMS */ }

    // Update the original record's status
    await c.env.qesuite_db.prepare(
      "UPDATE notifications_log SET status = ? WHERE id = ?"
    ).bind(newStatus, id).run()

    // Log the send attempt as a new entry so history is preserved
    const prefix = notif.status === 'queued' ? '[QUEUED→SEND]' : '[RESEND]'
    await c.env.qesuite_db.prepare(
      `INSERT INTO notifications_log (id, tenant_id, order_id, channel, recipient, message, status, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      generateId(), tenantId, notif.order_id, notif.channel,
      notif.recipient, `${prefix} ${messageText}`, newStatus
    ).run()

    const action = notif.status === 'queued' ? 'sent' : 'resent'
    return c.json({
      success: true,
      data: { status: newStatus },
      error: null,
      message: newStatus === 'sent'
        ? `SMS ${action} successfully`
        : `Send failed — check your SMS credentials in Settings`,
    })
  } catch (err) {
    console.error('notification send error', err)
    return c.json({ success: false, error: 'Failed to send notification', data: null }, 500)
  }
})

// Keep backward-compatible alias
notifications.post('/:id/resend', async (c) => {
  const id = c.req.param('id')
  // Delegate to the unified send endpoint
  return c.redirect(`/api/notifications/${id}/send`, 307)
})

// GET /api/notifications/summary — counts by status for the dashboard badge
notifications.get('/summary', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const rows = await c.env.qesuite_db.prepare(
      `SELECT status, COUNT(*) as count FROM notifications_log
       WHERE tenant_id = ? GROUP BY status`
    ).bind(tenantId).all<{ status: string; count: number }>()

    const summary: Record<string, number> = {}
    for (const r of rows.results) summary[r.status] = r.count

    return c.json({ success: true, data: summary, error: null })
  } catch (err) {
    return c.json({ success: false, error: 'Failed to fetch summary', data: null }, 500)
  }
})

export default notifications
