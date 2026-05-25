export * from './constants';

import type { Currency, OrderStatus } from '@qesuite/types';
import { CURRENCY_SYMBOLS, APP_CONSTANTS } from './constants';

// ─────────────────────────────────────────────────────────────
// Currency formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format an integer amount (in cents/smallest unit) as a human-readable currency string.
 * Amounts are stored as integers (e.g. KES 1500 = 1500, not 15.00).
 */
export function formatCurrency(amount: number, currency: Currency = 'KES'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

/**
 * Format amount with two decimal places for USD/EUR/GBP.
 */
export function formatCurrencyDecimal(amount: number, currency: Currency = 'KES'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const hasDecimals = ['USD', 'EUR', 'GBP'].includes(currency);
  const value = hasDecimals ? amount / 100 : amount;
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(value);
  return `${symbol} ${formatted}`;
}

// ─────────────────────────────────────────────────────────────
// ID & code generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate a UUID v4.
 * Uses crypto.randomUUID() when available (Workers, Node 19+, modern browsers).
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short, human-readable order tracking code.
 * Format: QS-XXXXXXXX (8 alphanumeric chars, uppercase).
 */
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = APP_CONSTANTS.TRACKING_CODE_PREFIX + '-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─────────────────────────────────────────────────────────────
// Date & time utilities
// ─────────────────────────────────────────────────────────────

/**
 * Format an ISO date string to a human-readable local date.
 * e.g. "2024-06-01T12:00:00Z" → "1 Jun 2024, 3:00 PM"
 */
export function formatDate(date: string, locale = 'en-KE'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Nairobi',
  });
}

/**
 * Format an ISO date to short date only.
 * e.g. "2024-06-01T12:00:00Z" → "1 Jun 2024"
 */
export function formatDateShort(date: string, locale = 'en-KE'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  });
}

/**
 * Returns a relative "time ago" string.
 * e.g. "just now", "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((now - then) / 1000);

  if (diff < 30) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
  }
  if (diff < 2592000) {
    const w = Math.floor(diff / 604800);
    return `${w} week${w !== 1 ? 's' : ''} ago`;
  }
  const mo = Math.floor(diff / 2592000);
  return `${mo} month${mo !== 1 ? 's' : ''} ago`;
}

/**
 * Get today's date as YYYY-MM-DD in Nairobi timezone.
 */
export function todayNairobi(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Nairobi' });
}

/**
 * Add days to a date string and return YYYY-MM-DD.
 */
export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────
// String utilities
// ─────────────────────────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 * e.g. "My Store Name!" → "my-store-name"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize the first letter of each word.
 */
export function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate a string to maxLength, appending "..." if needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + '...';
}

// ─────────────────────────────────────────────────────────────
// Phone utilities (Kenya-centric)
// ─────────────────────────────────────────────────────────────

/**
 * Validate a Kenyan phone number.
 * Accepts: +254711234567 | 0711234567 | 254711234567
 */
export function validatePhone(phone: string): boolean {
  return APP_CONSTANTS.KENYA_PHONE_REGEX.test(phone.trim());
}

/**
 * Normalize any Kenya phone format to E.164 (+254XXXXXXXXX).
 * Returns null if the number is invalid.
 */
export function formatPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return '+254' + cleaned.slice(1);
  }
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  if (/^\+254[17]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Convert E.164 (+254711234567) to local display format (0711 234 567).
 */
export function displayPhone(phone: string): string {
  const normalized = formatPhone(phone);
  if (!normalized) return phone;
  const local = '0' + normalized.slice(4);
  return local.replace(/^(0\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
}

// ─────────────────────────────────────────────────────────────
// Order helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if an order status is a terminal state.
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED';
}

/**
 * Calculate cart totals from items and delivery fee.
 */
export function calculateCartTotals(
  items: { price: number; sale_price: number | null; quantity: number }[],
  deliveryFee = 0,
): { subtotal: number; delivery_fee: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.sale_price !== null ? item.sale_price : item.price;
    return sum + unitPrice * item.quantity;
  }, 0);
  return {
    subtotal,
    delivery_fee: deliveryFee,
    total: subtotal + deliveryFee,
  };
}

// ─────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────

/**
 * Deep clone a plain object (no functions, no circular refs).
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Pause execution for ms milliseconds (use sparingly in Workers).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pick specific keys from an object.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}

/**
 * Omit specific keys from an object.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) delete result[key];
  return result as Omit<T, K>;
}

/**
 * Group an array of objects by a key.
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Sum a numeric field across an array of objects.
 */
export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);
}

/**
 * Return a success API response shape.
 */
export function apiSuccess<T>(data: T, message?: string) {
  return { success: true as const, data, ...(message ? { message } : {}) };
}

/**
 * Return an error API response shape.
 */
export function apiError(error: string, code?: string) {
  return { success: false as const, error, ...(code ? { code } : {}) };
}
