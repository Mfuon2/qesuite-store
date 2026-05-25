import api from './index'
import type { ApiResponse, PaginatedResponse } from '@qesuite/types'
import type { AdminStore, AdminStoreDetail } from '@/stores/stores'
export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'superadmin'
}
import type { PlatformMetrics, ChartDataPoint, StoreGrowthPoint } from '@/stores/metrics'

// ─── Auth ───────────────────────────────────────────────────

export interface AdminLoginResponse {
  token: string
  user: AdminUser
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await api.post<ApiResponse<{ access_token: string; user: AdminUser }>>('/api/auth/login', { identifier: email, password })
  if (!res.success || !res.data) throw new Error(res.error || 'Login failed')
  if (res.data.user.role !== 'superadmin') throw new Error('Not an admin account')
  return { token: res.data.access_token, user: res.data.user }
}

// ─── Stores ─────────────────────────────────────────────────

export interface StoreListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort_by?: string
  sort_dir?: string
}

export async function getStores(params: StoreListParams = {}): Promise<PaginatedResponse<AdminStore>> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  if (params.sort_by) qs.set('sort_by', params.sort_by)
  if (params.sort_dir) qs.set('sort_dir', params.sort_dir)
  return api.get<PaginatedResponse<AdminStore>>(`/api/admin/stores?${qs.toString()}`)
}

interface StoreDetailResponse {
  tenant: Record<string, unknown>
  settings: Record<string, unknown> | null
  order_stats: { total_orders: number; total_revenue: number } | null
}

export async function getStore(id: string): Promise<AdminStoreDetail> {
  const res = await api.get<ApiResponse<StoreDetailResponse>>(`/api/admin/stores/${id}`)
  if (!res.success || !res.data) throw new Error(res.error || 'Store not found')
  const { tenant, settings, order_stats } = res.data
  return {
    ...(tenant as AdminStoreDetail),
    delivery_enabled: Boolean(settings?.delivery_enabled ?? false),
    pickup_enabled: Boolean(settings?.pickup_enabled ?? false),
    currency: (settings?.currency as string) ?? 'KES',
    total_orders: order_stats?.total_orders ?? 0,
    total_gmv: order_stats?.total_revenue ?? 0,
  }
}

export async function suspendStore(id: string, reason: string): Promise<void> {
  await api.put<ApiResponse<null>>(`/api/admin/stores/${id}/suspend`, { reason })
}

export async function unsuspendStore(id: string): Promise<void> {
  await api.put<ApiResponse<null>>(`/api/admin/stores/${id}/unsuspend`, {})
}

export async function extendTrial(id: string, days: number): Promise<void> {
  await api.put<ApiResponse<null>>(`/api/admin/stores/${id}/extend-trial`, { days })
}

export interface ImpersonationTokenResponse {
  token: string
  expires_at: string
}

export async function getImpersonationToken(id: string): Promise<ImpersonationTokenResponse> {
  const res = await api.post<ApiResponse<ImpersonationTokenResponse>>(
    `/api/admin/stores/${id}/impersonate`,
    {}
  )
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate token')
  return res.data
}

// ─── Metrics ────────────────────────────────────────────────

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const res = await api.get<ApiResponse<PlatformMetrics>>('/api/admin/metrics')
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to load metrics')
  return res.data
}

export async function getGMVChart(period: string): Promise<ChartDataPoint[]> {
  const res = await api.get<ApiResponse<ChartDataPoint[]>>(`/api/admin/metrics/gmv?period=${period}`)
  if (!res.success || !res.data) return []
  return res.data
}

export async function getStoreGrowthChart(period: string): Promise<StoreGrowthPoint[]> {
  const res = await api.get<ApiResponse<StoreGrowthPoint[]>>(
    `/api/admin/metrics/store-growth?period=${period}`
  )
  if (!res.success || !res.data) return []
  return res.data
}

// ─── Billing ────────────────────────────────────────────────

export interface PlatformBillingRecord {
  id: string
  store_name: string
  store_id: string
  plan: string | null
  amount: number
  currency: string
  status: string
  payment_method: string
  reference: string | null
  paid_at: string | null
  created_at: string
}

export async function getPlatformBilling(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
}): Promise<PaginatedResponse<PlatformBillingRecord>> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  return api.get<PaginatedResponse<PlatformBillingRecord>>(`/api/admin/billing?${qs.toString()}`)
}

export interface StoreBillingHistory {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  reference: string | null
  paid_at: string | null
  created_at: string
}

export async function getStoreBillingHistory(storeId: string): Promise<StoreBillingHistory[]> {
  const res = await api.get<ApiResponse<StoreBillingHistory[]>>(
    `/api/admin/stores/${storeId}/billing`
  )
  if (!res.success || !res.data) return []
  return res.data
}
