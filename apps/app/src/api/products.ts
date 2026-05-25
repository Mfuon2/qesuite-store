import { apiFetch } from './index'
import type { ApiResponse, PaginatedResponse, Product, ProductCreate, ProductUpdate } from '@qesuite/types'

export async function apiGetProducts(params?: { category_id?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Product>> {
  const qs = new URLSearchParams()
  if (params?.category_id) qs.set('category_id', params.category_id)
  if (params?.search) qs.set('search', params.search)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const q = qs.toString()
  return apiFetch(`/api/products${q ? `?${q}` : ''}`)
}

export async function apiGetProduct(id: string): Promise<ApiResponse<Product>> {
  return apiFetch(`/api/products/${id}`)
}

export async function apiCreateProduct(payload: ProductCreate): Promise<ApiResponse<Product>> {
  return apiFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiUpdateProduct(id: string, payload: ProductUpdate): Promise<ApiResponse<Product>> {
  return apiFetch(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function apiDeleteProduct(id: string): Promise<ApiResponse<null>> {
  return apiFetch(`/api/products/${id}`, { method: 'DELETE' })
}

export async function apiBulkImportProducts(rows: ProductCreate[]): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
  return apiFetch('/api/products/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ products: rows })
  })
}

export async function apiGetUploadUrl(filename: string, contentType: string): Promise<ApiResponse<{ upload_url: string; public_url: string }>> {
  return apiFetch(`/api/images/presign?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(contentType)}`)
}
