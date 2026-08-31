import api from './index'
import type { ApiResponse, PaginatedResponse, Customer, CustomerDetail } from '@qesuite/types'

export type CustomerInput = { name: string; phone: string; email?: string | null; credit_limit?: number }

export function apiGetCustomers(params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Customer>> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  return api.get<PaginatedResponse<Customer>>(`/api/customers?${qs.toString()}`)
}

export function apiGetCustomer(id: string): Promise<ApiResponse<CustomerDetail>> {
  return api.get<ApiResponse<CustomerDetail>>(`/api/customers/${id}`)
}

export function apiCreateCustomer(payload: CustomerInput): Promise<ApiResponse<{ id: string }>> {
  return api.post<ApiResponse<{ id: string }>>('/api/customers', payload)
}

export function apiUpdateCustomer(id: string, payload: CustomerInput): Promise<ApiResponse<{ id: string }>> {
  return api.put<ApiResponse<{ id: string }>>(`/api/customers/${id}`, payload)
}
