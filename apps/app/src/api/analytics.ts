import { apiFetch } from './index'
import type { ApiResponse, AnalyticsSummary, RevenueDataPoint, TopProduct } from '@qesuite/types'

export interface PeakHour {
  hour: number
  orders: number
}

export interface PaymentMethodBreakdown {
  method: string
  count: number
  total: number
  percentage: number
}

export interface AnalyticsParams {
  from?: string
  to?: string
  period?: 'today' | 'week' | 'month'
}

function buildParams(p?: AnalyticsParams): string {
  const qs = new URLSearchParams()
  if (p?.period) qs.set('period', p.period)
  if (p?.from) qs.set('from', p.from)
  if (p?.to) qs.set('to', p.to)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function apiGetAnalyticsSummary(params?: AnalyticsParams): Promise<ApiResponse<AnalyticsSummary & { prev: AnalyticsSummary }>> {
  return apiFetch(`/api/analytics/summary${buildParams(params)}`)
}

export async function apiGetRevenueChart(params?: AnalyticsParams): Promise<ApiResponse<RevenueDataPoint[]>> {
  return apiFetch(`/api/analytics/revenue${buildParams(params)}`)
}

export async function apiGetTopProducts(params?: AnalyticsParams): Promise<ApiResponse<{ by_revenue: TopProduct[]; by_volume: TopProduct[] }>> {
  return apiFetch(`/api/analytics/top-products${buildParams(params)}`)
}

export async function apiGetPeakHours(params?: AnalyticsParams): Promise<ApiResponse<PeakHour[]>> {
  return apiFetch(`/api/analytics/peak-hours${buildParams(params)}`)
}

export async function apiGetPaymentMethods(params?: AnalyticsParams): Promise<ApiResponse<PaymentMethodBreakdown[]>> {
  return apiFetch(`/api/analytics/payment-methods${buildParams(params)}`)
}
