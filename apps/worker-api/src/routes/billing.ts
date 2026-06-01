import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'
import { normalizeKenyaPhone } from '../lib/notifications'

const billing = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── Public webhook — no auth ───────────────────────────────────────────────

// POST /api/billing/mpesa/callback — Safaricom STK push result webhook
billing.post('/mpesa/callback', async (c) => {
  try {
    const body = await c.req.json<{
      Body: {
        stkCallback: {
          MerchantRequestID: string
          CheckoutRequestID: string
          ResultCode: number
          ResultDesc: string
          CallbackMetadata?: {
            Item: Array<{ Name: string; Value?: string | number }>
          }
        }
      }
    }>()

    const cb = body?.Body?.stkCallback
    if (!cb) return c.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = cb

    // Lookup which tenant initiated this checkout
    const pending = await c.env.qesuite_db.prepare(
      "SELECT tenant_id FROM notifications_log WHERE channel = 'sms' AND recipient = ? AND message LIKE 'MPESA_PENDING:%' LIMIT 1"
    ).bind(CheckoutRequestID).first<{ tenant_id: string }>()

    if (!pending) {
      console.warn('mpesa/callback: unknown checkout_request_id', CheckoutRequestID)
      return c.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const { tenant_id } = pending

    if (ResultCode === 0) {
      // Payment successful — extract amount and receipt
      const items = CallbackMetadata?.Item ?? []
      const amount = Number(items.find(i => i.Name === 'Amount')?.Value ?? 999)
      const receipt = String(items.find(i => i.Name === 'MpesaReceiptNumber')?.Value ?? '')

      // Activate subscription
      await c.env.qesuite_db.prepare(
        "UPDATE tenants SET subscription_status = 'active' WHERE id = ?"
      ).bind(tenant_id).run()

      // Upsert subscription record — stack on top of any remaining active period
      const existingSub = await c.env.qesuite_db.prepare(
        'SELECT id, current_period_end, status FROM subscriptions WHERE tenant_id = ?'
      ).bind(tenant_id).first<{ id: string; current_period_end: string | null; status: string }>()

      // If there is an active sub whose end date is still in the future, start the new
      // period from that end date so paid days are never lost (subscription stacking).
      const now = new Date()
      const existingEnd = existingSub?.current_period_end ? new Date(existingSub.current_period_end) : null
      const periodStart = (existingSub?.status === 'active' && existingEnd && existingEnd > now)
        ? existingEnd   // queue: new period follows the current one
        : now           // no active sub or already expired: start immediately

      const periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      if (existingSub) {
        await c.env.qesuite_db.prepare(
          "UPDATE subscriptions SET status = 'active', amount = ?, payment_method = 'mpesa', current_period_start = ?, current_period_end = ? WHERE tenant_id = ?"
        ).bind(amount, periodStart.toISOString(), periodEnd.toISOString(), tenant_id).run()
      } else {
        await c.env.qesuite_db.prepare(
          `INSERT INTO subscriptions (id, tenant_id, plan, amount, currency, status, current_period_start, current_period_end, payment_method)
           VALUES (?, ?, 'starter', ?, 'KES', 'active', ?, ?, 'mpesa')`
        ).bind(generateId(), tenant_id, amount, periodStart.toISOString(), periodEnd.toISOString()).run()
      }

      // Record billing history
      await c.env.qesuite_db.prepare(
        `INSERT INTO billing_history (id, tenant_id, amount, currency, status, payment_method, reference, paid_at, created_at)
         VALUES (?, ?, ?, 'KES', 'paid', 'mpesa', ?, datetime('now'), datetime('now'))`
      ).bind(generateId(), tenant_id, amount, receipt).run()

      // Mark pending notification as processed
      await c.env.qesuite_db.prepare(
        "UPDATE notifications_log SET status = 'delivered', message = 'MPESA_CONFIRMED:' || ? WHERE recipient = ? AND message LIKE 'MPESA_PENDING:%'"
      ).bind(receipt, CheckoutRequestID).run()

      console.info(`Subscription activated for tenant ${tenant_id} via M-Pesa, receipt ${receipt}`)
    } else {
      // Payment failed — update log
      await c.env.qesuite_db.prepare(
        "UPDATE notifications_log SET status = 'failed' WHERE recipient = ? AND message LIKE 'MPESA_PENDING:%'"
      ).bind(CheckoutRequestID).run()
      console.warn(`M-Pesa payment failed for tenant ${tenant_id}: ${cb.ResultDesc}`)
    }

    return c.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err) {
    console.error('mpesa/callback error', err)
    return c.json({ ResultCode: 0, ResultDesc: 'Accepted' }) // always 200 to Safaricom
  }
})

billing.use('*', authMiddleware, tenantGuard)

// GET /api/billing/subscription
billing.get('/subscription', async (c) => {
  const tenantId = c.get('user').tenant_id!
  const sub = await c.env.qesuite_db.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?')
    .bind(tenantId).first()
  // If no subscription record yet, return tenant trial info
  if (!sub) {
    const tenant = await c.env.qesuite_db.prepare(
      'SELECT plan, subscription_status, trial_ends_at FROM tenants WHERE id = ?'
    ).bind(tenantId).first()
    return c.json({ success: true, data: tenant, error: null })
  }
  return c.json({ success: true, data: sub, error: null })
})

// GET /api/billing/history
billing.get('/history', async (c) => {
  const tenantId = c.get('user').tenant_id!
  const { results } = await c.env.qesuite_db.prepare(
    'SELECT * FROM billing_history WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(tenantId).all()
  return c.json({ success: true, data: results, error: null })
})

// POST /api/billing/mpesa — initiate subscription payment via M-Pesa
billing.post('/mpesa', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const { phone } = await c.req.json<{ phone: string }>()
    if (!phone) return c.json({ success: false, error: 'phone is required', data: null }, 400)

    // Normalize to 254XXXXXXXXX for Safaricom API
    // Handles: +254724… | 254724… | 0724… | 724… (bare 9-digit)
    const normalizedPhone = normalizeKenyaPhone(phone)
    // else assume already starts with 254
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const password = btoa(`${c.env.MPESA_SHORTCODE}${c.env.MPESA_PASSKEY}${timestamp}`)

    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${btoa(`${c.env.MPESA_CONSUMER_KEY}:${c.env.MPESA_CONSUMER_SECRET}`)}`,
        },
      }
    )
    const tokenData = await tokenRes.json() as { access_token: string }

    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: c.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: 999,
          PartyA: normalizedPhone,
          PartyB: c.env.MPESA_SHORTCODE,
          PhoneNumber: normalizedPhone,
          CallBackURL: `${c.env.MPESA_CALLBACK_URL}/mpesa/callback`,
          AccountReference: `SUB-${tenantId.slice(0, 8).toUpperCase()}`,
          TransactionDesc: 'QeSuite Subscription Payment',
        }),
      }
    )
    const stkData = await stkRes.json() as {
      ResponseCode: string; CheckoutRequestID: string; CustomerMessage: string
    }

    if (stkData.ResponseCode !== '0') {
      return c.json({ success: false, error: 'STK Push failed', data: null }, 502)
    }

    // Store checkout_request_id → tenant mapping so the callback can resolve the tenant
    await c.env.qesuite_db.prepare(
      `INSERT INTO notifications_log (id, tenant_id, channel, recipient, message, status, sent_at)
       VALUES (?, ?, 'sms', ?, ?, 'sent', datetime('now'))`
    ).bind(generateId(), tenantId, stkData.CheckoutRequestID, `MPESA_PENDING:${normalizedPhone}`).run()

    return c.json({
      success: true,
      data: { checkout_request_id: stkData.CheckoutRequestID, message: stkData.CustomerMessage },
      error: null,
    })
  } catch (err) {
    console.error('billing/mpesa error', err)
    return c.json({ success: false, error: 'Payment initiation failed', data: null }, 500)
  }
})

export default billing
