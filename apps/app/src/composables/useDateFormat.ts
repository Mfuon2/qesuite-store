/**
 * Global date/time formatting composable.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Cloudflare D1 (SQLite) stores all timestamps in UTC and returns them as
 * strings like "2026-06-01 14:30:00" — no timezone indicator.  When the
 * browser calls `new Date("2026-06-01 14:30:00")` the spec says the result is
 * implementation-defined (most treat it as LOCAL time, not UTC), so users in
 * different regions see wrong times.
 *
 * This composable:
 *   1. Normalises every raw DB string to an unambiguous UTC instant.
 *   2. Formats the result in the configured app timezone (default: Africa/Nairobi).
 *   3. Provides a time-aware greeting computed from the same clock.
 *
 * Africa/Nairobi is intentionally fixed for this Kenya operating application.
 * It is not derived from the browser or an environment override.
 */

import { APP_TIME_ZONE, parseAppTimestamp } from '@qesuite/shared'

const APP_TZ = APP_TIME_ZONE

/** Parse a raw date string from D1/SQLite as UTC regardless of browser locale. */
function toUTC(raw: string | null | undefined): Date | null {
  if (!raw) return null
  return parseAppTimestamp(raw)
}

/** Short date: "1 Jun 2026" */
export function formatDate(raw: string | null | undefined): string {
  const d = toUTC(raw)
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-KE', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Date + time: "1 Jun 2026, 17:30" */
export function formatDateTime(raw: string | null | undefined): string {
  const d = toUTC(raw)
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-KE', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Time only: "17:30" */
export function formatTime(raw: string | null | undefined): string {
  const d = toUTC(raw)
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-KE', {
    timeZone: APP_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Relative time: "just now", "5m ago", "2h ago", "3d ago" */
export function timeAgo(raw: string | null | undefined): string {
  const d = toUTC(raw)
  if (!d || isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/**
 * Time-aware greeting based on the APP_TZ clock — not the browser's locale.
 * Returns "morning", "afternoon", or "evening".
 */
export function getGreeting(): 'morning' | 'afternoon' | 'evening' {
  // Get current hour in the app timezone
  const hour = parseInt(
    new Date().toLocaleString('en-KE', { timeZone: APP_TZ, hour: 'numeric', hour12: false }),
    10
  )
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

/** Composable — returns all helpers plus a reactive greeting string. */
export function useDateFormat() {
  return { formatDate, formatDateTime, formatTime, timeAgo, getGreeting, APP_TZ }
}
