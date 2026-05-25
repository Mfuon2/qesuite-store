import type { OrderStatus, Plan, PlanDetails, Currency } from '@qesuite/types';

// ─────────────────────────────────────────────────────────────
// Order status metadata
// ─────────────────────────────────────────────────────────────

export const ORDER_STATUSES: Record<
  OrderStatus,
  { label: string; label_sw: string; color: string; bg: string; next: OrderStatus[] }
> = {
  NEW: {
    label: 'New',
    label_sw: 'Mpya',
    color: '#2563eb',
    bg: '#dbeafe',
    next: ['CONFIRMED', 'CANCELLED'],
  },
  CONFIRMED: {
    label: 'Confirmed',
    label_sw: 'Imethibitishwa',
    color: '#7c3aed',
    bg: '#ede9fe',
    next: ['PREPARING', 'CANCELLED'],
  },
  PREPARING: {
    label: 'Preparing',
    label_sw: 'Inaandaliwa',
    color: '#d97706',
    bg: '#fef3c7',
    next: ['READY'],
  },
  READY: {
    label: 'Ready',
    label_sw: 'Iko tayari',
    color: '#0891b2',
    bg: '#cffafe',
    next: ['OUT_FOR_DELIVERY'],
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    label_sw: 'Inawasilishwa',
    color: '#f59e0b',
    bg: '#fffbeb',
    next: ['DELIVERED', 'CANCELLED'],
  },
  DELIVERED: {
    label: 'Delivered',
    label_sw: 'Imewasilishwa',
    color: '#059669',
    bg: '#d1fae5',
    next: [],
  },
  CANCELLED: {
    label: 'Cancelled',
    label_sw: 'Imefutwa',
    color: '#dc2626',
    bg: '#fee2e2',
    next: [],
  },
};

// ─────────────────────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────────────────────

export const PLANS: Record<Plan, PlanDetails> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    price_kes: 0,
    price_usd: 0,
    max_products: 20,
    max_staff: 2,
    features: [
      '20 products',
      '2 staff accounts',
      'Basic storefront',
      'M-Pesa payments',
      'SMS notifications',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price_kes: 999,
    price_usd: 8,
    max_products: 100,
    max_staff: 5,
    features: [
      '100 products',
      '5 staff accounts',
      'Custom branding',
      'M-Pesa + Stripe payments',
      'SMS & WhatsApp notifications',
      'Delivery tracking',
      'Analytics dashboard',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price_kes: 2499,
    price_usd: 20,
    max_products: 500,
    max_staff: 15,
    features: [
      '500 products',
      '15 staff accounts',
      'All Starter features',
      'Priority support',
      'Advanced analytics',
      'Bulk product import',
      'Multi-rider dispatch',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price_kes: 5999,
    price_usd: 49,
    max_products: -1,
    max_staff: -1,
    features: [
      'Unlimited products',
      'Unlimited staff',
      'All Growth features',
      'Dedicated support',
      'Custom domain',
      'API access',
      'White-label option',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price_kes: 0,
    price_usd: 0,
    max_products: -1,
    max_staff: -1,
    features: [
      'Everything in Pro',
      'Custom SLA',
      'On-premise option',
      'Dedicated infrastructure',
      'Custom integrations',
      'Account manager',
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Currency symbols
// ─────────────────────────────────────────────────────────────

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  KES: 'KES',
  USD: '$',
  EUR: '€',
  GBP: '£',
  UGX: 'UGX',
  TZS: 'TZS',
};

// ─────────────────────────────────────────────────────────────
// Payment methods
// ─────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = {
  pay_on_delivery: { label: 'Pay on Delivery', label_sw: 'Lipa uwasilishwaji' },
  mpesa: { label: 'M-Pesa', label_sw: 'M-Pesa' },
  stripe: { label: 'Card', label_sw: 'Kadi' },
} as const;

// ─────────────────────────────────────────────────────────────
// Vehicle types
// ─────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = {
  bicycle: { label: 'Bicycle', icon: '🚲' },
  motorcycle: { label: 'Motorcycle', icon: '🏍️' },
  car: { label: 'Car', icon: '🚗' },
  on_foot: { label: 'On Foot', icon: '🚶' },
} as const;

// ─────────────────────────────────────────────────────────────
// SMS / WhatsApp message templates
// ─────────────────────────────────────────────────────────────

export const SMS_TEMPLATES = {
  en: {
    order_received: (trackingCode: string, storeName: string) =>
      `Your order #${trackingCode} has been received by ${storeName}. We'll confirm it shortly. Track: ${trackingCode}`,

    order_confirmed: (trackingCode: string, storeName: string) =>
      `Great news! Your order #${trackingCode} from ${storeName} has been confirmed and is being prepared.`,

    order_ready: (trackingCode: string) =>
      `Your order #${trackingCode} is ready and will be picked up by a rider shortly.`,

    order_out_for_delivery: (trackingCode: string, riderName: string, riderPhone: string) =>
      `Your order #${trackingCode} is on its way! Rider: ${riderName} (${riderPhone}). Track your order in real-time.`,

    order_delivered: (trackingCode: string, storeName: string) =>
      `Your order #${trackingCode} has been delivered. Thank you for shopping with ${storeName}!`,

    order_cancelled: (trackingCode: string, reason?: string) =>
      `Your order #${trackingCode} has been cancelled.${reason ? ` Reason: ${reason}.` : ''} Contact us for assistance.`,

    otp: (otp: string) =>
      `Your QeSuite verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,

    magic_link: (link: string, storeName: string) =>
      `${storeName}: Click to access your delivery dashboard: ${link} (expires in 24 hours)`,
  },
  sw: {
    order_received: (trackingCode: string, storeName: string) =>
      `Agizo lako #${trackingCode} limepokelewa na ${storeName}. Tutakuthibitishia hivi karibuni. Fuatilia: ${trackingCode}`,

    order_confirmed: (trackingCode: string, storeName: string) =>
      `Habari njema! Agizo lako #${trackingCode} kutoka ${storeName} limethibitishwa na linaandaliwa.`,

    order_ready: (trackingCode: string) =>
      `Agizo lako #${trackingCode} liko tayari na litachukuliwa na boda boda hivi karibuni.`,

    order_out_for_delivery: (trackingCode: string, riderName: string, riderPhone: string) =>
      `Agizo lako #${trackingCode} linakuja! Boda: ${riderName} (${riderPhone}). Fuatilia agizo lako kwa wakati halisi.`,

    order_delivered: (trackingCode: string, storeName: string) =>
      `Agizo lako #${trackingCode} limewasilishwa. Asante kwa kununua kutoka ${storeName}!`,

    order_cancelled: (trackingCode: string, reason?: string) =>
      `Agizo lako #${trackingCode} limefutwa.${reason ? ` Sababu: ${reason}.` : ''} Wasiliana nasi kwa usaidizi.`,

    otp: (otp: string) =>
      `Nambari yako ya uthibitisho ya QeSuite ni ${otp}. Inafaa kwa dakika 10. Usishiriki nambari hii.`,

    magic_link: (link: string, storeName: string) =>
      `${storeName}: Bonyeza ili ufikiwe dashibodi yako ya uwasilishaji: ${link} (inaisha baada ya saa 24)`,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// App-wide constants
// ─────────────────────────────────────────────────────────────

export const APP_CONSTANTS = {
  OTP_EXPIRY_MINUTES: 10,
  MAGIC_LINK_EXPIRY_HOURS: 24,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  TRIAL_DAYS: 14,
  MAX_UPLOAD_SIZE_MB: 5,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  TRACKING_CODE_PREFIX: 'QS',
  KENYA_PHONE_REGEX: /^(\+?254|0)[17]\d{8}$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

export const NAIROBI_CENTER: { lat: number; lng: number } = {
  lat: -1.286389,
  lng: 36.817223,
};
