import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'

const billing = new Hono<{ Bindings: Env; Variables: Variables }>()

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

    const normalizedPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '254')
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
          CallBackURL: `${c.env.MPESA_CALLBACK_URL}/subscription`,
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
