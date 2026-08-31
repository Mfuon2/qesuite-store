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
    ...(tenant as unknown as AdminStoreDetail),
    delivery_enabled: Boolean(settings?.delivery_enabled ?? false),
    pickup_enabled: Boolean(settings?.pickup_enabled ?? false),
    currency: (settings?.currency as string) ?? 'KES',
    total_orders: order_stats?.total_orders ?? 0,
    total_gmv: order_stats?.total_revenue ?? 0,
  }
}

export interface StoreProfileUpdate {
  name?: string
  slug?: string
  address?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  store_category?: string
  primary_color?: string
  accent_color?: string
  font_family?: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
}

export async function updateStoreProfile(id: string, payload: StoreProfileUpdate): Promise<void> {
  const res = await api.put<ApiResponse<null>>(`/api/admin/stores/${id}/profile`, payload)
  if (!res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to update profile')
}

export async function updateStoreModules(id: string, disabledModules: string[]): Promise<string[]> {
  const res = await api.put<ApiResponse<{ disabled_modules: string[] }>>(`/api/admin/stores/${id}/modules`, { disabled_modules: disabledModules })
  if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to update modules')
  return res.data.disabled_modules
}

export async function deleteStore(id: string): Promise<void> {
  const res = await api.delete<ApiResponse<null>>(`/api/admin/stores/${id}`)
  if (res && !res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to delete store')
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

export interface ResetPasswordResponse {
  new_password: string
}

export async function resetStoreUserPassword(
  id: string,
  password?: string
): Promise<ResetPasswordResponse> {
  const res = await api.post<ApiResponse<ResetPasswordResponse>>(
    `/api/admin/stores/${id}/reset-password`,
    password ? { password } : {}
  )
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to reset password')
  return res.data
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

export async function verifyBillingReference(recordId: string, action: 'approve' | 'reject'): Promise<void> {
  const res = await api.post<ApiResponse<{ status: string }>>(`/api/admin/billing/${recordId}/verify`, { action })
  if (!res.success) throw new Error(res.error || 'Failed to review payment reference')
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

// ─── Per-store subscription management ───────────────────────

export interface StoreSubscription {
  id: string
  tenant_id: string
  plan: string
  amount: number
  currency: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  payment_method: string | null
  created_at: string
}

export interface StoreSubscriptionOverview {
  tenant: {
    id: string; name: string; plan: string
    subscription_status: string; trial_ends_at: string | null; is_suspended: number
  }
  subscription: StoreSubscription | null
  billing_history: StoreBillingHistory[]
}

export async function getStoreSubscription(storeId: string): Promise<StoreSubscriptionOverview> {
  const res = await api.get<ApiResponse<StoreSubscriptionOverview>>(`/api/admin/stores/${storeId}/subscription`)
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to load subscription')
  return res.data
}

export async function updateStoreSubscription(storeId: string, payload: {
  plan?: string; amount?: number; currency?: string
  current_period_start?: string; current_period_end?: string; payment_method?: string
}): Promise<void> {
  const res = await api.put<ApiResponse<null>>(`/api/admin/stores/${storeId}/subscription`, payload)
  if (!res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to update subscription')
}

export async function activateStoreSubscription(storeId: string, payload: {
  plan?: string; amount?: number; period_months?: number; payment_method?: string
}): Promise<void> {
  const res = await api.post<ApiResponse<null>>(`/api/admin/stores/${storeId}/subscription/activate`, payload)
  if (!res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to activate')
}

export async function cancelStoreSubscription(storeId: string): Promise<void> {
  await api.post<ApiResponse<null>>(`/api/admin/stores/${storeId}/subscription/cancel`, {})
}

export async function reviveStoreSubscription(storeId: string, period_months = 1): Promise<void> {
  await api.post<ApiResponse<null>>(`/api/admin/stores/${storeId}/subscription/revive`, { period_months })
}

export async function adjustSubscriptionDays(storeId: string, days: number): Promise<void> {
  const res = await api.post<ApiResponse<null>>(`/api/admin/stores/${storeId}/subscription/adjust-days`, { days })
  if (!res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to adjust days')
}

export async function updateStoreTrial(storeId: string, payload: {
  action: 'enable' | 'disable' | 'set_date' | 'add_days'
  trial_end_date?: string
  days?: number
}): Promise<void> {
  const res = await api.put<ApiResponse<null>>(`/api/admin/stores/${storeId}/trial`, payload)
  if (!res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to update trial')
}

export async function addStoreBillingRecord(storeId: string, payload: {
  amount: number; currency?: string; status: string
  payment_method: string; reference?: string
}): Promise<void> {
  const res = await api.post<ApiResponse<null>>(`/api/admin/stores/${storeId}/billing`, payload)
  if (!res.success) throw new Error((res as ApiResponse<null>).error ?? 'Failed to add record')
}
