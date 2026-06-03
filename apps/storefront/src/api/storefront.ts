import api from './index'
import type {
  StorefrontConfig,
  Product,
  Category,
  Order,
  OrderCreate,
  TrackOrderResponse,
  ApiResponse,
  StoreCategory,
} from '@qesuite/types'

export interface ProductPreview {
  name: string
  image_url: string | null
}

export interface StoreListItem {
  id: string
  name: string
  slug: string
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  accent_color: string
  address: string | null
  lat: number | null
  lng: number | null
  store_category: StoreCategory
  product_previews: ProductPreview[]
}

export async function getStores(opts?: { category?: string; search?: string }): Promise<StoreListItem[]> {
  const params = new URLSearchParams()
  if (opts?.category && opts.category !== 'all') params.set('category', opts.category)
  if (opts?.search) params.set('search', opts.search)
  const qs = params.toString() ? `?${params}` : ''
  const res = await api.get<ApiResponse<StoreListItem[]>>(`/storefront${qs}`)
  if (!res.success || !res.data) return []
  return res.data
}

export interface MpesaInitResponse {
  checkout_request_id: string
  merchant_request_id: string
  message: string
}

export interface MpesaStatusResponse {
  status: 'pending' | 'paid' | 'failed'
  message?: string
}

export async function getStore(slug: string): Promise<StorefrontConfig> {
  const res = await api.get<ApiResponse<StorefrontConfig>>(`/storefront/${slug}`)
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to load store')
  return res.data
}

export async function getProducts(slug: string, categoryId?: string): Promise<Product[]> {
  const params = categoryId ? `?category_id=${categoryId}` : ''
  const res = await api.get<ApiResponse<Product[]>>(`/storefront/${slug}/products${params}`)
  if (!res.success || !res.data) return []
  return res.data
}

export async function getCategories(slug: string): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>(`/storefront/${slug}/categories`)
  if (!res.success || !res.data) return []
  return res.data
}

export async function placeOrder(slug: string, data: OrderCreate): Promise<Order> {
  const res = await api.post<ApiResponse<Order>>(`/storefront/${slug}/orders`, data)
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to place order')
  return res.data
}

export async function trackOrder(slug: string, code: string): Promise<TrackOrderResponse> {
  const res = await api.get<ApiResponse<TrackOrderResponse>>(
    `/storefront/${slug}/track/${code}`
  )
  if (!res.success || !res.data) throw new Error(res.error || 'Order not found')
  return res.data
}

export async function initiateMpesa(
  slug: string,
  phone: string,
  orderId: string
): Promise<MpesaInitResponse> {
  const res = await api.post<ApiResponse<MpesaInitResponse>>(
    `/storefront/${slug}/mpesa/initiate`,
    { phone, order_id: orderId }
  )
  if (!res.success || !res.data) throw new Error(res.error || 'Failed to initiate M-Pesa')
  return res.data
}

export async function checkMpesaStatus(orderId: string): Promise<MpesaStatusResponse> {
  const res = await api.get<ApiResponse<MpesaStatusResponse>>(
    `/storefront/mpesa/status/${orderId}`
  )
  if (!res.success || !res.data) return { status: 'pending' }
  return res.data
}
