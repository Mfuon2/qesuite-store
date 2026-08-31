import api from './index'
import type { ApiResponse, PurchaseOrder } from '@qesuite/types'

export type PurchaseOrderItemInput = { product_id: string; quantity_ordered: number; unit_cost: number }
export type PurchaseOrderInput = { supplier_id: string; notes?: string; items: PurchaseOrderItemInput[] }
export type ReceiveInput = { items: { item_id: string; quantity_received_now: number }[] }

export function apiGetPurchaseOrders(status?: string): Promise<ApiResponse<PurchaseOrder[]>> {
  return api.get(`/api/purchase-orders${status ? `?status=${status}` : ''}`)
}

export function apiGetPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
  return api.get(`/api/purchase-orders/${id}`)
}

export function apiCreatePurchaseOrder(payload: PurchaseOrderInput): Promise<ApiResponse<{ id: string; po_number: string }>> {
  return api.post('/api/purchase-orders', payload)
}

export function apiUpdatePurchaseOrder(id: string, payload: PurchaseOrderInput): Promise<ApiResponse<{ id: string }>> {
  return api.put(`/api/purchase-orders/${id}`, payload)
}

export function apiSubmitPurchaseOrder(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/purchase-orders/${id}/submit`, {})
}

export function apiApprovePurchaseOrder(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/purchase-orders/${id}/approve`, {})
}

export function apiRejectPurchaseOrder(id: string, reason?: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/purchase-orders/${id}/reject`, { reason })
}

export function apiSendPurchaseOrder(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/purchase-orders/${id}/send`, {})
}

export function apiCancelPurchaseOrder(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/purchase-orders/${id}/cancel`, {})
}

export function apiReceivePurchaseOrder(id: string, payload: ReceiveInput): Promise<ApiResponse<{ id: string; status: string }>> {
  return api.post(`/api/purchase-orders/${id}/receive`, payload)
}
