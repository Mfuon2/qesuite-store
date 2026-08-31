import { apiFetch } from './index'
import type { ApiResponse, AnalyticsSummary, EmployeePerformance, RevenueDataPoint, TopProduct } from '@qesuite/types'

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

export interface FinancialPeriodSummary {
  revenue: number
  cogs: number
  gross_profit: number
  gross_margin: number | null
  expenses: number
  variance: number
  net_profit: number
  expense_ratio: number | null
  margin: number | null
  expense_count: number
  online_orders: number
  pos_sales: number
  total_orders: number
  avg_order_value: number
  delivered_orders: number
  cancelled_orders: number
  completion_rate: number
  period_days: number
}

export interface FinancialPerformance extends FinancialPeriodSummary {
  date_from: string
  date_to: string
  previous: FinancialPeriodSummary
  daily: Array<{
    date: string
    revenue: number
    cogs: number
    gross_profit: number
    expenses: number
    variance: number
  }>
  by_category: Array<{ category: string; total: number; count: number }>
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

export async function apiGetEmployeePerformance(params?: AnalyticsParams): Promise<ApiResponse<EmployeePerformance[]>> {
  return apiFetch(`/api/analytics/employees${buildParams(params)}`)
}

export async function apiGetRevenueChart(params?: AnalyticsParams): Promise<ApiResponse<RevenueDataPoint[]>> {
  return apiFetch(`/api/analytics/revenue${buildParams(params)}`)
}

export async function apiGetFinancialPerformance(params?: AnalyticsParams): Promise<ApiResponse<FinancialPerformance>> {
  return apiFetch(`/api/analytics/profit-loss${buildParams(params)}`)
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
