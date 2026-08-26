import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'
import { nairobiCompactTimestamp } from '../lib/time'

const payments = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── M-Pesa helpers ────────────────────────────────────────────────────────────

async function getMpesaToken(env: Env): Promise<string> {
  const credentials = btoa(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`)
  const response = await fetch(
    'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  )
  if (!response.ok) throw new Error('Failed to get M-Pesa token')
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

function getMpesaPassword(shortcode: string, passkey: string): { password: string; timestamp: string } {
  const timestamp = nairobiCompactTimestamp()
  const password = btoa(`${shortcode}${passkey}${timestamp}`)
  return { password, timestamp }
}

// POST /api/payments/mpesa/initiate
payments.post('/mpesa/initiate', async (c) => {
  try {
    const body = await c.req.json<{
      phone: string
      amount: number
      order_id: string
      slug: string
    }>()

    if (!body.phone || !body.amount || !body.order_id) {
      return c.json({ error: 'phone, amount, and order_id are required', data: null }, 400)
    }

    // Validate order exists
    const order = await c.env.qesuite_db.prepare(
      "SELECT id, tenant_id FROM orders WHERE id = ? AND payment_status = 'pending'"
    ).bind(body.order_id).first<{ id: string; tenant_id: string }>()

    if (!order) {
      return c.json({ error: 'Order not found or already paid', data: null }, 404)
    }

    const token = await getMpesaToken(c.env)
    const { password, timestamp } = getMpesaPassword(c.env.MPESA_SHORTCODE, c.env.MPESA_PASSKEY)

    // Normalise phone: 0712345678 → 254712345678
    const phone = body.phone.startsWith('0')
      ? `254${body.phone.substring(1)}`
      : body.phone.replace(/^\+/, '')

    const payload = {
      BusinessShortCode: c.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(body.amount),
      PartyA: phone,
      PartyB: c.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: c.env.MPESA_CALLBACK_URL,
      AccountReference: `ORDER-${body.order_id.substring(0, 8).toUpperCase()}`,
      TransactionDesc: `QeSuite order payment`,
    }

    const stkResponse = await fetch(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const stkData = (await stkResponse.json()) as {
      ResponseCode?: string
      CheckoutRequestID?: string
      CustomerMessage?: string
      errorMessage?: string
    }

    if (!stkResponse.ok || stkData.ResponseCode !== '0') {
      console.error('STK Push failed:', stkData)
      return c.json({ error: stkData.errorMessage ?? 'STK Push failed', data: null }, 502)
    }

    // Persist CheckoutRequestID so the callback can locate this order
    if (stkData.CheckoutRequestID) {
      await c.env.qesuite_db.prepare(
        `INSERT INTO notifications_log (id, channel, recipient, message, status, metadata, created_at)
         VALUES (?, 'mpesa_checkout', ?, 'STK Push initiated', 'sent', ?, datetime('now'))`
      ).bind(
        generateId(),
        body.phone,
        JSON.stringify({ order_id: body.order_id, checkout_request_id: stkData.CheckoutRequestID })
      ).run().catch(() => { /* non-fatal */ })
    }

    return c.json({
      data: {
        checkout_request_id: stkData.CheckoutRequestID,
        message: stkData.CustomerMessage,
      },
      error: null,
      message: 'Check your phone for the M-Pesa prompt',
    })
  } catch (err) {
    console.error('mpesa initiate error', err)
    return c.json({ error: 'Failed to initiate M-Pesa payment', data: null }, 500)
  }
})

// POST /api/payments/mpesa/callback — Daraja callback (public, no auth)
payments.post('/mpesa/callback', async (c) => {
  try {
    const body = (await c.req.json()) as {
      Body?: {
        stkCallback?: {
          ResultCode: number
          ResultDesc: string
          CheckoutRequestID: string
          CallbackMetadata?: {
            Item: Array<{ Name: string; Value?: string | number }>
          }
        }
      }
    }

    const callback = body?.Body?.stkCallback
    if (!callback) {
      return c.json({ error: 'Invalid callback', data: null }, 400)
    }

    const checkoutRequestId = callback.CheckoutRequestID
    if (!checkoutRequestId) {
      return c.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (callback.ResultCode === 0) {
      // Match on CheckoutRequestID stored in notifications_log at STK initiation
      const meta = callback.CallbackMetadata?.Item ?? []
      const mpesaRef = meta.find((i) => i.Name === 'MpesaReceiptNumber')?.Value as string | undefined

      // Look up the order by the CheckoutRequestID we stored when we sent the STK push
      const logEntry = await c.env.qesuite_db.prepare(
        `SELECT metadata FROM notifications_log
         WHERE channel = 'mpesa_checkout' AND metadata LIKE ?
         ORDER BY created_at DESC LIMIT 1`
      ).bind(`%${checkoutRequestId}%`).first<{ metadata: string }>()

      let orderId: string | null = null
      if (logEntry?.metadata) {
        try {
          const m = JSON.parse(logEntry.metadata) as { order_id?: string; checkout_request_id?: string }
          if (m.checkout_request_id === checkoutRequestId) orderId = m.order_id ?? null
        } catch { /* malformed log — fall through */ }
      }

      if (orderId) {
        await c.env.qesuite_db.prepare(
          `UPDATE orders SET payment_status = 'paid', updated_at = datetime('now')
           WHERE id = ? AND payment_status = 'pending' AND payment_method = 'mpesa'`
        ).bind(orderId).run()
        if (mpesaRef) {
          // Store receipt reference on the order for audit
          await c.env.qesuite_db.prepare(
            `UPDATE orders SET notes = COALESCE(notes || ' ', '') || ? WHERE id = ?`
          ).bind(`[M-Pesa ref: ${mpesaRef}]`, orderId).run().catch(() => {})
        }
      } else {
        console.warn('M-Pesa callback: no order found for CheckoutRequestID', checkoutRequestId)
      }
    } else {
      console.warn(`M-Pesa payment failed (${checkoutRequestId}):`, callback.ResultDesc)
    }

    return c.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err) {
    console.error('mpesa callback error', err)
    return c.json({ ResultCode: 1, ResultDesc: 'Error' })
  }
})

// POST /api/payments/stripe/intent — create PaymentIntent
payments.post('/stripe/intent', async (c) => {
  try {
    const { order_id, currency = 'kes' } = await c.req.json<{
      order_id: string
      currency?: string
    }>()

    if (!order_id) {
      return c.json({ error: 'order_id is required', data: null }, 400)
    }

    const order = await c.env.qesuite_db.prepare(
      "SELECT id, total, customer_phone FROM orders WHERE id = ? AND payment_status = 'pending'"
    ).bind(order_id).first<{ id: string; total: number; customer_phone: string }>()

    if (!order) {
      return c.json({ error: 'Order not found or already paid', data: null }, 404)
    }

    // Stripe uses smallest currency unit (cents/fils) — KES is already in shillings, Stripe needs x100
    const amountInCents = order.total * 100

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amountInCents),
        currency: currency.toLowerCase(),
        'metadata[order_id]': order_id,
        'automatic_payment_methods[enabled]': 'true',
      }),
    })

    const intent = (await response.json()) as {
      id?: string
      client_secret?: string
      error?: { message: string }
    }

    if (!response.ok || !intent.client_secret) {
      return c.json({ error: intent.error?.message ?? 'Failed to create payment intent', data: null }, 502)
    }

    return c.json({
      data: {
        payment_intent_id: intent.id,
        client_secret: intent.client_secret,
      },
      error: null,
    })
  } catch (err) {
    console.error('stripe intent error', err)
    return c.json({ error: 'Failed to create Stripe payment intent', data: null }, 500)
  }
})

// POST /api/payments/stripe/webhook — Stripe webhook (public)
payments.post('/stripe/webhook', async (c) => {
  try {
    const payload = await c.req.text()
    const signature = c.req.header('stripe-signature')

    if (!signature) {
      return c.json({ error: 'Missing stripe-signature header', data: null }, 400)
    }

    // Stripe signature verification using HMAC-SHA256
    const [, ts, , v1] = signature.split(/[=,]/)
    const signedPayload = `${ts}.${payload}`

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(c.env.STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
    const computedV1 = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (computedV1 !== v1) {
      return c.json({ error: 'Invalid signature', data: null }, 400)
    }

    const event = JSON.parse(payload) as {
      type: string
      data: { object: { metadata?: { order_id?: string }; status?: string } }
    }

    if (event.type === 'payment_intent.succeeded') {
      const orderId = event.data.object.metadata?.order_id
      if (orderId) {
        await c.env.qesuite_db.prepare(
          "UPDATE orders SET payment_status = 'paid', updated_at = datetime('now') WHERE id = ?"
        ).bind(orderId).run()
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const orderId = event.data.object.metadata?.order_id
      if (orderId) {
        await c.env.qesuite_db.prepare(
          "UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?"
        ).bind(orderId).run()
      }
    }

    return c.json({ received: true })
  } catch (err) {
    console.error('stripe webhook error', err)
    return c.json({ error: 'Webhook processing failed', data: null }, 500)
  }
})

// POST /api/payments/subscription — initiate subscription payment
payments.post('/subscription', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can manage subscriptions', data: null }, 403)
    }
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      plan: string
      payment_method: 'mpesa' | 'stripe'
      mpesa_phone?: string
      stripe_payment_method_id?: string
    }>()

    const planPrices: Record<string, number> = { starter: 999 }
    const amount = planPrices[body.plan] ?? 999

    const subscriptionId = generateId()
    const now = new Date()
    const periodStart = now.toISOString()
    const periodEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString()

    // Upsert subscription record
    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM subscriptions WHERE tenant_id = ?'
    ).bind(tenantId).first<{ id: string }>()

    if (existing) {
      await c.env.qesuite_db.prepare(
        `UPDATE subscriptions SET plan = ?, amount = ?, payment_method = ?,
         current_period_start = ?, current_period_end = ?, status = 'active'
         WHERE tenant_id = ?`
      ).bind(body.plan, amount, body.payment_method, periodStart, periodEnd, tenantId).run()
    } else {
      await c.env.qesuite_db.prepare(
        `INSERT INTO subscriptions (id, tenant_id, plan, amount, currency, status, payment_method,
         current_period_start, current_period_end, mpesa_phone, created_at)
         VALUES (?, ?, ?, ?, 'KES', 'active', ?, ?, ?, ?, datetime('now'))`
      ).bind(
        subscriptionId, tenantId, body.plan, amount, body.payment_method,
        periodStart, periodEnd, body.mpesa_phone ?? null
      ).run()
    }

    // Update tenant plan
    await c.env.qesuite_db.prepare(
      "UPDATE tenants SET plan = ?, subscription_status = 'active' WHERE id = ?"
    ).bind(body.plan, tenantId).run()

    // Log billing history
    await c.env.qesuite_db.prepare(
      `INSERT INTO billing_history (id, tenant_id, amount, currency, status, payment_method, created_at)
       VALUES (?, ?, ?, 'KES', 'pending', ?, datetime('now'))`
    ).bind(generateId(), tenantId, amount, body.payment_method).run()

    // If M-Pesa, trigger STK push
    if (body.payment_method === 'mpesa' && body.mpesa_phone) {
      try {
        const token = await getMpesaToken(c.env)
        const { password, timestamp } = getMpesaPassword(c.env.MPESA_SHORTCODE, c.env.MPESA_PASSKEY)
        const phone = body.mpesa_phone.startsWith('0')
          ? `254${body.mpesa_phone.substring(1)}`
          : body.mpesa_phone.replace(/^\+/, '')

        await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: c.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phone,
            PartyB: c.env.MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: c.env.MPESA_CALLBACK_URL,
            AccountReference: `SUB-${tenantId.substring(0, 8).toUpperCase()}`,
            TransactionDesc: `QeSuite ${body.plan} subscription`,
          }),
        })
      } catch (mpesaErr) {
        console.error('Subscription STK push failed:', mpesaErr)
      }
    }

    return c.json({
      data: { subscription_id: subscriptionId, plan: body.plan, amount },
      error: null,
      message: 'Subscription initiated',
    })
  } catch (err) {
    console.error('subscription error', err)
    return c.json({ error: 'Failed to initiate subscription', data: null }, 500)
  }
})

export default payments
