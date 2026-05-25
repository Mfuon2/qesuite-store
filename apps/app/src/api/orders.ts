import { apiFetch } from './index'
import type { ApiResponse, PaginatedResponse, Order, OrderStatusUpdate, OrderFilters } from '@qesuite/types'

export async function apiGetOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.payment_status) params.set('payment_status', filters.payment_status)
  if (filters?.search) params.set('search', filters.search)
  if (filters?.from_date) params.set('from_date', filters.from_date)
  if (filters?.to_date) params.set('to_date', filters.to_date)
  if (filters?.page) params.set('page', String(filters.page))
  if (filters?.limit) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return apiFetch(`/api/orders${qs ? `?${qs}` : ''}`)
}

export async function apiGetOrder(id: string): Promise<ApiResponse<Order>> {
  return apiFetch(`/api/orders/${id}`)
}

export async function apiUpdateOrderStatus(id: string, payload: OrderStatusUpdate): Promise<ApiResponse<Order>> {
  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function apiGetPackingSlip(id: string): Promise<ApiResponse<{ text: string }>> {
  return apiFetch(`/api/orders/${id}/packing-slip`)
}

export async function apiAssignRider(orderId: string, staffId: string): Promise<ApiResponse<unknown>> {
  return apiFetch(`/api/delivery/assign`, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, staff_id: staffId })
  })
}
