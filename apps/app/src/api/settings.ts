import { apiFetch } from './index'
import type { ApiResponse, Tenant, StoreCategory, StoreSettings, StoreSettingsUpdate, Subscription, BillingHistory } from '@qesuite/types'

export interface TenantUpdate {
  name?: string
  slug?: string
  store_category?: StoreCategory
  logo_url?: string | null
  banner_url?: string | null
  primary_color?: string
  accent_color?: string
  font_family?: string
  phone?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  whatsapp_number?: string | null
}

export interface OnboardingProductRow {
  name: string
  price: number
  description?: string
  stock?: number
  image_url?: string
  sale_price?: number
}

export interface OnboardingPayload {
  tenant: TenantUpdate
  settings: StoreSettingsUpdate
  products?: OnboardingProductRow[]
  rider_phones?: string[]
}

export async function apiGetTenant(): Promise<ApiResponse<Tenant>> {
  return apiFetch('/api/settings/tenant')
}

export async function apiUpdateTenant(payload: TenantUpdate): Promise<ApiResponse<Tenant>> {
  return apiFetch('/api/settings/tenant', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function apiCheckSlug(slug: string): Promise<ApiResponse<{ available: boolean }>> {
  return apiFetch(`/api/settings/slug-check?slug=${encodeURIComponent(slug)}`)
}

export async function apiGetStoreSettings(): Promise<ApiResponse<StoreSettings>> {
  return apiFetch('/api/settings/store')
}

export async function apiUpdateStoreSettings(payload: StoreSettingsUpdate): Promise<ApiResponse<StoreSettings>> {
  return apiFetch('/api/settings/store', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function apiCompleteOnboarding(payload: OnboardingPayload): Promise<ApiResponse<{ tenant: Tenant; settings: StoreSettings }>> {
  return apiFetch('/api/settings/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiGetSubscription(): Promise<ApiResponse<Subscription>> {
  return apiFetch('/api/billing/subscription')
}

export async function apiGetBillingHistory(): Promise<ApiResponse<BillingHistory[]>> {
  return apiFetch('/api/billing/history')
}

export async function apiInitiateMpesaPayment(phone: string): Promise<ApiResponse<{ checkout_request_id: string }>> {
  return apiFetch('/api/billing/mpesa', {
    method: 'POST',
    body: JSON.stringify({ phone })
  })
}

export async function apiSubmitMpesaReference(reference: string): Promise<ApiResponse<BillingHistory>> {
  return apiFetch('/api/billing/mpesa/reference', {
    method: 'POST',
    body: JSON.stringify({ reference })
  })
}

export async function apiGetUploadUrl(filename: string, contentType: string, purpose?: 'product' | 'logo' | 'banner'): Promise<ApiResponse<{ upload_url: string; public_url: string }>> {
  return apiFetch('/api/upload/image', {
    method: 'POST',
    body: JSON.stringify({ filename, content_type: contentType, ...(purpose && { purpose }) })
  })
}
