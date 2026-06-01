import { Env } from '../types'
import {
  sendSMS,
  sendWhatsApp,
  getOrderConfirmedSMS,
  getOutForDeliverySMS,
  getDeliveredSMS,
  getNewOrderSMS,
} from '../lib/notifications'
import { generateId } from '../lib/jwt'

interface NotificationMessage {
  type: string
  order_id: string
  tenant_id: string
  tracking_code: string
  customer_phone: string
  customer_name?: string
  total?: number
  payment_method?: string
  slug?: string
  store_name?: string
  store_phone?: string | null
  whatsapp_number?: string | null
  rider_name?: string
  rider_phone?: string
}

async function logNotification(
  env: Env,
  tenantId: string,
  orderId: string | null,
  channel: 'sms' | 'whatsapp',
  recipient: string,
  message: string,
  status: 'queued' | 'sent' | 'failed'
): Promise<void> {
  try {
    await env.qesuite_db.prepare(
      `INSERT INTO notifications_log (id, tenant_id, order_id, channel, recipient, message, status, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(generateId(), tenantId, orderId ?? null, channel, recipient, message, status).run()
  } catch (logErr) {
    console.error('Failed to log notification:', logErr)
  }
}

export async function handleQueue(
  batch: MessageBatch<NotificationMessage>,
  env: Env
): Promise<void> {
  for (const message of batch.messages) {
    const data = message.body

    try {
      await processNotification(data, env)
      message.ack()
    } catch (err) {
      console.error(`Failed to process notification [${data.type}]:`, err)
      message.retry()
    }
  }
}

async function processNotification(data: NotificationMessage, env: Env): Promise<void> {
  const baseUrl = env.APP_BASE_URL
  const dashboardUrl = baseUrl.replace('store.', 'dashboard.')

  // Persist the queued notification intent before attempting delivery
  await logNotification(
    env,
    data.tenant_id,
    data.order_id,
    'sms',
    data.customer_phone ?? data.store_phone ?? '',
    JSON.stringify({ type: data.type, tracking_code: data.tracking_code }),
    'queued'
  )

  switch (data.type) {
    case 'ORDER_CONFIRMED': {
      // SMS to customer
      if (data.customer_phone && data.slug && data.store_name) {
        const msg = getOrderConfirmedSMS(
          data.tracking_code,
          data.total ?? 0,
          data.payment_method ?? 'pay_on_delivery',
          data.slug,
          data.store_name,
          baseUrl
        )
        try {
          await sendSMS(env, data.customer_phone, msg)
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'sent')
        } catch {
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'failed')
        }

        // WhatsApp to customer if store has WA number configured
        if (data.whatsapp_number) {
          try {
            await sendWhatsApp(env, data.customer_phone, msg)
            await logNotification(env, data.tenant_id, data.order_id, 'whatsapp', data.customer_phone, msg, 'sent')
          } catch {
            await logNotification(env, data.tenant_id, data.order_id, 'whatsapp', data.customer_phone, msg, 'failed')
          }
        }
      }

      // SMS to owner
      if (data.store_phone) {
        const ownerMsg = getNewOrderSMS(
          data.tracking_code,
          data.customer_name ?? 'Customer',
          data.total ?? 0,
          data.payment_method ?? 'pay_on_delivery',
          dashboardUrl
        )
        try {
          await sendSMS(env, data.store_phone, ownerMsg)
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.store_phone, ownerMsg, 'sent')
        } catch {
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.store_phone, ownerMsg, 'failed')
        }
      }
      break
    }

    case 'ORDER_STATUS_OUT_FOR_DELIVERY': {
      if (data.customer_phone && data.slug && data.rider_name && data.rider_phone) {
        const msg = getOutForDeliverySMS(
          data.tracking_code,
          data.rider_name,
          data.rider_phone,
          data.slug,
          baseUrl
        )
        try {
          await sendSMS(env, data.customer_phone, msg)
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'sent')
        } catch {
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'failed')
        }
      }
      break
    }

    case 'ORDER_STATUS_DELIVERED': {
      if (data.customer_phone && data.store_name) {
        const msg = getDeliveredSMS(data.tracking_code, data.store_name)
        try {
          await sendSMS(env, data.customer_phone, msg)
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'sent')
        } catch {
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'failed')
        }
      }
      break
    }

    case 'ORDER_STATUS_CONFIRMED':
    case 'ORDER_STATUS_PREPARING':
    case 'ORDER_STATUS_READY':
    case 'ORDER_STATUS_CANCELLED': {
      const storeName = data.store_name ?? 'the store'
      const statusMessages: Record<string, string> = {
        ORDER_STATUS_CONFIRMED: `Your order #${data.tracking_code} has been confirmed by ${storeName} and is being processed.`,
        ORDER_STATUS_PREPARING: `Your order #${data.tracking_code} is now being prepared. We will notify you when it is ready.`,
        ORDER_STATUS_READY:     `Your order #${data.tracking_code} is ready for collection. Please pick it up at ${storeName}.`,
        ORDER_STATUS_CANCELLED: `We're sorry — your order #${data.tracking_code} has been cancelled by ${storeName}. Please contact us if you have any questions.`,
      }
      const msg = statusMessages[data.type] ?? `Your order #${data.tracking_code} has been updated by ${storeName}.`

      if (data.customer_phone) {
        try {
          await sendSMS(env, data.customer_phone, msg)
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'sent')
        } catch {
          await logNotification(env, data.tenant_id, data.order_id, 'sms', data.customer_phone, msg, 'failed')
        }
      }
      break
    }

    default:
      console.warn(`Unknown notification type: ${data.type}`)
  }
}
