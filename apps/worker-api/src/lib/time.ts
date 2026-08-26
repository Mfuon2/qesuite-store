import { APP_TIME_ZONE, addDays, nairobiDate } from '@qesuite/shared'

/**
 * Application time policy
 *
 * D1 timestamps are stored as UTC instants. Business calendar dates and SQL
 * groupings are always evaluated with Nairobi's fixed UTC+03:00 offset.
 */
export const BUSINESS_TIME_ZONE = APP_TIME_ZONE
export const D1_NAIROBI_MODIFIER = '+3 hours' as const

export function businessDate(value: string | Date = new Date()): string {
  return nairobiDate(value)
}

export function businessDateDaysAgo(days: number, from: string | Date = new Date()): string {
  return addDays(businessDate(from), -days)
}

export function utcNow(): string {
  return new Date().toISOString()
}

/** Safaricom API timestamp format (YYYYMMDDHHmmss) using Nairobi local time. */
export function nairobiCompactTimestamp(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(value)
  const item = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${item.year}${item.month}${item.day}${item.hour}${item.minute}${item.second}`
}

export function inclusiveDateRange(period: string | null | undefined, from?: string | null, to?: string | null) {
  if (from && to) return { dateFrom: from, dateTo: to }
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30
  return {
    dateFrom: businessDateDaysAgo(days - 1),
    dateTo: businessDate(),
  }
}
