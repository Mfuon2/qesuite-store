import type { OrderStatus, Plan, PlanDetails, Currency } from '@qesuite/types';

// ─────────────────────────────────────────────────────────────
// Order status metadata
// ─────────────────────────────────────────────────────────────

export const ORDER_STATUSES: Record<
  OrderStatus,
  { label: string; description: string; color: string; bg: string; next: OrderStatus[] }
> = {
  NEW: {
    label: 'New',
    description: 'Order received and awaiting confirmation.',
    color: '#2563eb',
    bg: '#dbeafe',
    next: ['CONFIRMED', 'CANCELLED'],
  },
  CONFIRMED: {
    label: 'Confirmed',
    description: 'Order confirmed and being processed.',
    color: '#7c3aed',
    bg: '#ede9fe',
    next: ['PREPARING', 'CANCELLED'],
  },
  PREPARING: {
    label: 'Preparing',
    description: 'Order is being packed and prepared for dispatch.',
    color: '#d97706',
    bg: '#fef3c7',
    next: ['READY'],
  },
  READY: {
    label: 'Ready for Pickup',
    description: 'Order is packed and ready to be picked up by a rider.',
    color: '#0891b2',
    bg: '#cffafe',
    next: ['OUT_FOR_DELIVERY'],
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    description: 'Order is on its way to the customer.',
    color: '#f59e0b',
    bg: '#fffbeb',
    next: ['DELIVERED', 'CANCELLED'],
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Order has been successfully delivered.',
    color: '#059669',
    bg: '#d1fae5',
    next: [],
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Order has been cancelled.',
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
      'Up to 20 products',
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
      'Up to 100 products',
      '5 staff accounts',
      'Custom branding',
      'M-Pesa & Stripe payments',
      'SMS & WhatsApp notifications',
      'Live delivery tracking',
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
      'Up to 500 products',
      '15 staff accounts',
      'Everything in Starter',
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
      'Everything in Growth',
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
      'Custom service-level agreement',
      'On-premise deployment option',
      'Dedicated infrastructure',
      'Custom integrations',
      'Dedicated account manager',
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
  pay_on_delivery: { label: 'Pay on Delivery', description: 'Customer pays in cash upon receiving the order.' },
  mpesa:           { label: 'M-Pesa',          description: 'Mobile money payment via Safaricom M-Pesa.' },
  stripe:          { label: 'Card',            description: 'Credit or debit card payment via Stripe.' },
} as const;

// ─────────────────────────────────────────────────────────────
// Vehicle types
// ─────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = {
  bicycle:    { label: 'Bicycle',    icon: '🚲' },
  motorcycle: { label: 'Motorcycle', icon: '🏍️' },
  car:        { label: 'Car',        icon: '🚗' },
  on_foot:    { label: 'On Foot',    icon: '🚶' },
} as const;

// ─────────────────────────────────────────────────────────────
// SMS / WhatsApp message templates (English)
// ─────────────────────────────────────────────────────────────

export const SMS_TEMPLATES = {
  order_received: (trackingCode: string, storeName: string) =>
    `Hi! Your order #${trackingCode} has been received by ${storeName}. We will confirm it shortly.`,

  order_confirmed: (trackingCode: string, storeName: string) =>
    `Your order #${trackingCode} from ${storeName} has been confirmed and is now being prepared.`,

  order_ready: (trackingCode: string, storeName: string) =>
    `Your order #${trackingCode} is packed and ready. A rider from ${storeName} will collect it shortly.`,

  order_out_for_delivery: (trackingCode: string, riderName: string, riderPhone: string, trackUrl: string) =>
    `Your order #${trackingCode} is on its way! Rider: ${riderName} — ${riderPhone}. Track: ${trackUrl}`,

  order_delivered: (trackingCode: string, storeName: string) =>
    `Your order #${trackingCode} has been delivered. Thank you for shopping with ${storeName}! We hope to serve you again.`,

  order_cancelled: (trackingCode: string, storeName: string, reason?: string) =>
    `Your order #${trackingCode} from ${storeName} has been cancelled.${reason ? ` Reason: ${reason}.` : ''} Please contact us if you need assistance.`,

  new_order_owner: (trackingCode: string, customerName: string, total: number, paymentMethod: string, dashboardUrl: string) => {
    const method = paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'pay_on_delivery' ? 'Pay on Delivery' : 'Card';
    return `New order #${trackingCode}! Customer: ${customerName} | Total: KES ${total.toLocaleString()} | ${method}. Manage: ${dashboardUrl}`;
  },

  otp: (otp: string) =>
    `Your QeSuite verification code is ${otp}. It is valid for 10 minutes. Do not share this code with anyone.`,

  magic_link: (link: string, storeName: string) =>
    `${storeName}: Use this link to access your delivery dashboard — ${link}. It expires in 24 hours.`,

  subscription_reminder: (storeName: string, ownerName: string, appUrl: string, reminderNumber: number) => {
    const urgency = reminderNumber <= 2
      ? 'Friendly reminder'
      : reminderNumber <= 4
        ? 'Action required'
        : 'Urgent — immediate action needed';
    return `${urgency}: Hi ${ownerName}, your store "${storeName}" does not have an active subscription. Your store is currently offline and not accepting orders. Visit ${appUrl} to choose a plan and reactivate it. (Reminder ${reminderNumber})`;
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
  // Accepts: +254724… | 254724… | 0724… | 724… (bare 9-digit) — all Kenyan prefixes (7xx, 1xx)
  KENYA_PHONE_REGEX: /^(\+?254|0)?[17]\d{8}$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

export const NAIROBI_CENTER: { lat: number; lng: number } = {
  lat: -1.286389,
  lng: 36.817223,
};
