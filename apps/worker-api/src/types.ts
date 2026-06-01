export interface Env {
  qesuite_db: D1Database
  IMAGES: R2Bucket
  NOTIFICATION_QUEUE: Queue
  JWT_SECRET: string
  MPESA_CONSUMER_KEY: string
  MPESA_CONSUMER_SECRET: string
  MPESA_SHORTCODE: string
  MPESA_PASSKEY: string
  MPESA_CALLBACK_URL: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  AT_API_KEY: string
  AT_USERNAME: string
  AT_SENDER_ID: string
  SMS_API_KEY: string
  SMS_PARTNER_ID: string
  SMS_SHORTCODE: string
  SMS_BASE_URL: string
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_ID: string
  APP_BASE_URL: string
  CDN_URL?: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export interface JWTPayload {
  sub: string
  tenant_id: string | null
  role: 'owner' | 'staff' | 'rider' | 'superadmin'
  name: string
  exp: number
  iat: number
}

export interface Variables {
  user: JWTPayload
  tenant_id: string
}
