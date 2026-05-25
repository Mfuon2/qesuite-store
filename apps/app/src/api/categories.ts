import { apiFetch } from './index'
import type { ApiResponse, Category, CategoryCreate, CategoryUpdate } from '@qesuite/types'

export async function apiGetCategories(): Promise<ApiResponse<Category[]>> {
  return apiFetch('/api/categories')
}

export async function apiCreateCategory(payload: CategoryCreate): Promise<ApiResponse<Category>> {
  return apiFetch('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiUpdateCategory(id: string, payload: CategoryUpdate): Promise<ApiResponse<Category>> {
  return apiFetch(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function apiDeleteCategory(id: string): Promise<ApiResponse<null>> {
  return apiFetch(`/api/categories/${id}`, { method: 'DELETE' })
}

export async function apiReorderCategories(ids: string[]): Promise<ApiResponse<null>> {
  return apiFetch('/api/categories/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids })
  })
}
