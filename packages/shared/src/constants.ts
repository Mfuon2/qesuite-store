import type { OrderStatus, Plan, PlanDetails, Currency, StoreCategory } from '@qesuite/types';

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
// Store typography
// ─────────────────────────────────────────────────────────────

export const STORE_FONTS = ['Inter', 'Poppins', 'DM Sans', 'Nunito', 'Segoe UI'] as const;

/**
 * Return a complete CSS font stack for a configured store font.
 * Segoe UI is system-provided on Windows, so it intentionally does not require
 * a CDN download and falls back to the closest native UI fonts elsewhere.
 */
export function storeFontStack(fontFamily?: string | null): string {
  if (fontFamily === 'Segoe UI') {
    return "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
  }
  if (fontFamily && (STORE_FONTS as readonly string[]).includes(fontFamily)) {
    return `'${fontFamily}', sans-serif`;
  }
  return "'Inter', sans-serif";
}

// ─────────────────────────────────────────────────────────────
// Product category icons — curated per business type so the picker only
// shows icons that actually make sense for what the store sells.
//
// `value` is a Heroicons (24/outline) component name — plain string, no
// framework/icon-package dependency here. The app resolves it to an actual
// icon component for rendering (see CATEGORY_ICON_COMPONENTS in the app).
// ─────────────────────────────────────────────────────────────

export const CATEGORY_ICON_PRESETS: Record<StoreCategory, { value: string; label: string }[]> = {
  groceries: [
    { value: 'SparklesIcon', label: 'Fresh produce' },
    { value: 'CakeIcon', label: 'Bakery' },
    { value: 'BeakerIcon', label: 'Beverages' },
    { value: 'CubeIcon', label: 'Pantry & dry goods' },
    { value: 'FireIcon', label: 'Hot & prepared' },
    { value: 'ArchiveBoxIcon', label: 'Frozen & bulk' },
    { value: 'ShoppingBagIcon', label: 'Packaged goods' },
    { value: 'HomeIcon', label: 'Household' },
  ],
  food: [
    { value: 'FireIcon', label: 'Hot mains' },
    { value: 'CakeIcon', label: 'Desserts' },
    { value: 'BeakerIcon', label: 'Drinks' },
    { value: 'SparklesIcon', label: 'Specials' },
    { value: 'ShoppingBagIcon', label: 'Takeaway' },
    { value: 'HeartIcon', label: 'Chef favorites' },
    { value: 'ClipboardDocumentListIcon', label: 'Combos & meals' },
    { value: 'GiftIcon', label: 'Kids menu' },
  ],
  fashion: [
    { value: 'ShoppingBagIcon', label: "Women's wear" },
    { value: 'BriefcaseIcon', label: "Men's wear" },
    { value: 'GiftIcon', label: 'Kids' },
    { value: 'SwatchIcon', label: 'Accessories' },
    { value: 'SparklesIcon', label: 'Jewelry' },
    { value: 'StarIcon', label: 'New arrivals' },
  ],
  electronics: [
    { value: 'DevicePhoneMobileIcon', label: 'Phones' },
    { value: 'ComputerDesktopIcon', label: 'Computers' },
    { value: 'TvIcon', label: 'TVs & displays' },
    { value: 'SpeakerWaveIcon', label: 'Audio' },
    { value: 'DeviceTabletIcon', label: 'Tablets' },
    { value: 'CameraIcon', label: 'Cameras' },
    { value: 'PuzzlePieceIcon', label: 'Gaming' },
    { value: 'BoltIcon', label: 'Chargers & accessories' },
  ],
  pharmacy: [
    { value: 'BeakerIcon', label: 'Medicine' },
    { value: 'ShieldCheckIcon', label: 'First aid & safety' },
    { value: 'HeartIcon', label: 'Health & wellness' },
    { value: 'SparklesIcon', label: 'Personal care' },
    { value: 'GiftIcon', label: 'Baby care' },
    { value: 'SunIcon', label: 'Vitamins & supplements' },
    { value: 'HomeIcon', label: 'Home health devices' },
  ],
  beauty: [
    { value: 'SparklesIcon', label: 'Makeup' },
    { value: 'ScissorsIcon', label: 'Hair care' },
    { value: 'HeartIcon', label: 'Skincare' },
    { value: 'BeakerIcon', label: 'Bath & body' },
    { value: 'StarIcon', label: 'Nails' },
  ],
  home: [
    { value: 'HomeIcon', label: 'Furniture' },
    { value: 'HomeModernIcon', label: 'Decor' },
    { value: 'WrenchScrewdriverIcon', label: 'Hardware & tools' },
    { value: 'FireIcon', label: 'Kitchenware' },
    { value: 'ArchiveBoxIcon', label: 'Storage & organization' },
    { value: 'SparklesIcon', label: 'Cleaning' },
  ],
  sports: [
    { value: 'FireIcon', label: 'Fitness' },
    { value: 'SunIcon', label: 'Outdoor' },
    { value: 'ShoppingBagIcon', label: 'Apparel' },
    { value: 'StarIcon', label: 'Team sports' },
    { value: 'ShieldCheckIcon', label: 'Protective gear' },
    { value: 'CubeIcon', label: 'Equipment' },
  ],
  other: [
    { value: 'ShoppingBagIcon', label: 'General' },
    { value: 'ArchiveBoxIcon', label: 'Miscellaneous' },
    { value: 'StarIcon', label: 'Featured' },
    { value: 'GiftIcon', label: 'Gifts' },
  ],
};

/**
 * Icon options for a category picker: the business's own vertical first,
 * plus the generic "other" set appended so there's always a fallback icon
 * for a category that doesn't fit the vertical (e.g. "Sale items").
 */
export function categoryIconOptions(storeCategory: StoreCategory): { value: string; label: string }[] {
  const specific = CATEGORY_ICON_PRESETS[storeCategory] ?? CATEGORY_ICON_PRESETS.other;
  if (storeCategory === 'other') return specific;
  const extras = CATEGORY_ICON_PRESETS.other.filter(
    generic => !specific.some(item => item.value === generic.value)
  );
  return [...specific, ...extras];
}

// ─────────────────────────────────────────────────────────────
// Payment methods
// ─────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = {
  pay_on_delivery: { label: 'Pay on Delivery', description: 'Customer pays in cash upon receiving the order.' },
  mpesa:           { label: 'M-Pesa',          description: 'Mobile money payment via Safaricom M-Pesa.' },
  stripe:          { label: 'Card',            description: 'Credit or debit card payment via Stripe.' },
} as const;

// ─────────────────────────────────────────────────────────────
// Expense categories (restaurant Sales Terminal)
// ─────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = {
  supplies:     { label: 'Supplies & Ingredients' },
  rent:         { label: 'Rent' },
  utilities:    { label: 'Utilities' },
  staff_wages:  { label: 'Staff Wages' },
  maintenance:  { label: 'Maintenance & Repairs' },
  other:        { label: 'Other' },
} as const;

// ─────────────────────────────────────────────────────────────
// Store staff access control
// ─────────────────────────────────────────────────────────────

export const ACCESS_PERMISSION_GROUPS = [
  {
    id: 'dashboard', label: 'Dashboard', description: 'Store overview and customer summaries',
    permissions: [
      { key: 'dashboard.view', label: 'View dashboard', operation: 'Menu' },
    ],
  },
  {
    id: 'orders', label: 'Orders', description: 'Online orders and fulfilment',
    permissions: [
      { key: 'orders.view', label: 'View orders', operation: 'Menu' },
      { key: 'orders.update_status', label: 'Update order status', operation: 'Operate' },
      { key: 'orders.manage_payments', label: 'Record payments', operation: 'Operate' },
      { key: 'orders.assign_delivery', label: 'Assign deliveries', operation: 'Operate' },
    ],
  },
  {
    id: 'pos', label: 'Sales terminal', description: 'Counter sales and till controls',
    permissions: [
      { key: 'pos.view', label: 'View sales terminal', operation: 'Menu' },
      { key: 'pos.create_sale', label: 'Complete sales', operation: 'Operate' },
      { key: 'pos.void_sale', label: 'Void completed sales', operation: 'Sensitive' },
      { key: 'pos.manage_till', label: 'Open, adjust, and close till', operation: 'Sensitive' },
    ],
  },
  {
    id: 'expenses', label: 'Expenses', description: 'Business expense records',
    permissions: [
      { key: 'expenses.view', label: 'View expenses', operation: 'Menu' },
      { key: 'expenses.create', label: 'Record expenses', operation: 'Operate' },
      { key: 'expenses.delete', label: 'Delete expenses', operation: 'Sensitive' },
    ],
  },
  {
    id: 'products', label: 'Products', description: 'Catalog and stock',
    permissions: [
      { key: 'products.view', label: 'View products', operation: 'Menu' },
      { key: 'products.create', label: 'Add and import products', operation: 'Operate' },
      { key: 'products.edit', label: 'Edit products and stock', operation: 'Operate' },
      { key: 'products.delete', label: 'Delete products', operation: 'Sensitive' },
    ],
  },
  {
    id: 'categories', label: 'Categories', description: 'Catalog organization',
    permissions: [
      { key: 'categories.view', label: 'View categories', operation: 'Menu' },
      { key: 'categories.manage', label: 'Create, edit, reorder, and delete', operation: 'Operate' },
    ],
  },
  {
    id: 'delivery', label: 'Delivery team', description: 'Riders and assignments',
    permissions: [
      { key: 'delivery.view', label: 'View delivery team', operation: 'Menu' },
      { key: 'delivery.manage_staff', label: 'Add and edit riders', operation: 'Sensitive' },
      { key: 'delivery.assign', label: 'Assign orders to riders', operation: 'Operate' },
    ],
  },
  {
    id: 'analytics', label: 'Analytics', description: 'Sales, costs, and employee performance',
    permissions: [
      { key: 'analytics.view', label: 'View analytics', operation: 'Menu' },
      { key: 'analytics.view_employees', label: 'View employee performance', operation: 'Sensitive' },
    ],
  },
  {
    id: 'notifications', label: 'Notifications', description: 'Customer communication log',
    permissions: [
      { key: 'notifications.view', label: 'View notifications', operation: 'Menu' },
      { key: 'notifications.send', label: 'Send and resend messages', operation: 'Operate' },
    ],
  },
  {
    id: 'settings', label: 'Settings', description: 'Store configuration',
    permissions: [
      { key: 'settings.view', label: 'View settings', operation: 'Menu' },
      { key: 'settings.edit', label: 'Edit store settings', operation: 'Sensitive' },
    ],
  },
  {
    id: 'billing', label: 'Billing', description: 'Subscription and payments',
    permissions: [
      { key: 'billing.view', label: 'View billing', operation: 'Menu' },
      { key: 'billing.manage', label: 'Change plan and submit payments', operation: 'Sensitive' },
    ],
  },
] as const;

export type AccessPermissionKey = typeof ACCESS_PERMISSION_GROUPS[number]['permissions'][number]['key'];

export const ALL_ACCESS_PERMISSIONS = ACCESS_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => permission.key)
) as AccessPermissionKey[];

export const ACCESS_PRESETS = {
  manager: ALL_ACCESS_PERMISSIONS.filter(key => key !== 'billing.manage'),
  sales: [
    'dashboard.view', 'orders.view', 'orders.update_status', 'orders.manage_payments',
    'orders.assign_delivery', 'pos.view', 'pos.create_sale', 'products.view',
    'categories.view', 'delivery.view', 'delivery.assign',
  ],
  inventory: [
    'dashboard.view', 'orders.view', 'products.view', 'products.create',
    'products.edit', 'categories.view', 'categories.manage',
  ],
  accountant: [
    'dashboard.view', 'pos.view', 'expenses.view', 'expenses.create',
    'analytics.view', 'analytics.view_employees', 'billing.view',
  ],
} as const satisfies Record<string, readonly AccessPermissionKey[]>;

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
  // Strict local format as dialled in Kenya: 07XX XXX XXX or 01XX XXX XXX (10 digits)
  KENYA_LOCAL_PHONE_REGEX: /^0[17]\d{8}$/,
  // M-Pesa receipt/transaction codes: 10 alphanumeric characters (e.g. QGH7XK9L2T)
  MPESA_CODE_REGEX: /^[A-Z0-9]{10}$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

export const NAIROBI_CENTER: { lat: number; lng: number } = {
  lat: -1.286389,
  lng: 36.817223,
};
