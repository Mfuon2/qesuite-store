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
  GOOGLE_PLACES_KEY?: string
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_ID: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USERNAME?: string
  SMTP_PASSWORD?: string
  EMAIL_FROM_NAME?: string
  APP_BASE_URL: string
  APP_TIME_ZONE: 'Africa/Nairobi'
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

// A separate credential kind from JWTPayload, not a `role` value — a device
// session identifies *what device* is acting, orthogonal to *which user*
// (JWTPayload) is acting. Both participate in authorization; neither replaces
// the other. Revocation is enforced via the pos_device_sessions/pos_devices
// DB rows the deviceSessionMiddleware checks, not by the JWT alone.
export interface DeviceSessionPayload {
  session_id: string
  device_id: string
  tenant_id: string
  user_id: string
  scope: 'pos'
  exp: number
  iat: number
}

export interface Variables {
  user: JWTPayload
  tenant_id: string
  disabledModules?: string[]
  deviceSession?: DeviceSessionPayload
}
