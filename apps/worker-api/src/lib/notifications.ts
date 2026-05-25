import { Env } from '../types'

export async function sendSMS(env: Env, phone: string, message: string): Promise<void> {
  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      apiKey: env.AT_API_KEY,
    },
    body: new URLSearchParams({
      username: env.AT_USERNAME,
      to: phone,
      message,
      from: env.AT_SENDER_ID,
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('SMS send failed:', err)
  }
}

export async function sendWhatsApp(env: Env, phone: string, message: string): Promise<void> {
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
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    }
  )
  if (!response.ok) {
    const err = await response.text()
    console.error('WhatsApp send failed:', err)
  }
}

export function getOrderConfirmedSMS(
  code: string,
  total: number,
  method: string,
  slug: string,
  storeName: string,
  baseUrl: string
): string {
  return `Habari! Agizo lako #${code} limepokelewa.\nJumla: KES ${total} | Malipo: ${method}\nFuatilia: ${baseUrl}/${slug}/track/${code}\n- ${storeName}`
}

export function getOutForDeliverySMS(
  code: string,
  riderName: string,
  riderPhone: string,
  slug: string,
  baseUrl: string
): string {
  return `Agizo lako #${code} liko njiani!\nDereva: ${riderName} | Simu: ${riderPhone}\nFuatilia: ${baseUrl}/${slug}/track/${code}`
}

export function getDeliveredSMS(code: string, storeName: string): string {
  return `Agizo #${code} limefikia. Asante kwa ununuzi!\n- ${storeName}`
}

export function getNewOrderSMS(
  code: string,
  customerName: string,
  total: number,
  method: string,
  dashboardUrl: string
): string {
  return `Agizo jipya #${code}!\n${customerName} | KES ${total} | ${method}\nFungua: ${dashboardUrl}`
}
