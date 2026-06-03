import { apiFetch } from './index'
import type { ApiResponse, PaginatedResponse, Order, OrderItem, DeliveryAssignment, OrderStatusUpdate, OrderFilters } from '@qesuite/types'

// The worker returns { data: { items, total, page, limit }, error }
// — NOT a flat PaginatedResponse. Normalise here so callers get a consistent shape.
interface RawOrdersResponse {
  data: { items: Order[]; total: number; page: number; limit: number } | null
  error: string | null
}

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
  const raw = await apiFetch<RawOrdersResponse>(`/api/orders${qs ? `?${qs}` : ''}`)
  const items = raw.data?.items ?? []
  const total = raw.data?.total ?? 0
  const page  = raw.data?.page  ?? 1
  const limit = raw.data?.limit ?? 20
  return {
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  }
}

// Backend returns { data: { order, items, assignment }, error }
interface RawOrderDetailResponse {
  data: { order: Order; items: OrderItem[]; assignment: DeliveryAssignment | null } | null
  error: string | null
}

export async function apiGetOrder(id: string): Promise<ApiResponse<Order>> {
  const raw = await apiFetch<RawOrderDetailResponse>(`/api/orders/${id}`)
  if (!raw.data?.order) {
    return { success: false, error: raw.error ?? 'Order not found' }
  }
  return {
    success: true,
    data: {
      ...raw.data.order,
      items: raw.data.items ?? [],
      assignment: raw.data.assignment ?? undefined,
    },
  }
}

// Backend returns { data: { id, status, previous_status }, error, message } — not a full Order.
// We only need the call to succeed; callers update local state themselves.
export async function apiUpdateOrderStatus(id: string, payload: OrderStatusUpdate): Promise<void> {
  await apiFetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

// Backend returns { data: { packing_slip }, error } — field is packing_slip, not text.
interface RawPackingSlipResponse {
  data: { packing_slip: string } | null
  error: string | null
}

export async function apiGetPackingSlip(id: string): Promise<ApiResponse<{ text: string }>> {
  const raw = await apiFetch<RawPackingSlipResponse>(`/api/orders/${id}/packing-slip`)
  if (!raw.data) return { success: false, error: raw.error ?? 'Failed to load packing slip' }
  return { success: true, data: { text: raw.data.packing_slip } }
}

export async function apiAssignRider(orderId: string, staffId: string): Promise<ApiResponse<unknown>> {
  return apiFetch(`/api/delivery/assign`, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, staff_id: staffId })
  })
}

export async function apiRecordPayment(
  orderId: string,
  payload: { reference?: string; note?: string; method?: string }
): Promise<ApiResponse<{ payment_id: string; reference: string | null }>> {
  return apiFetch(`/api/orders/${orderId}/payment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
