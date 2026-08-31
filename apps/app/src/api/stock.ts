import api from './index'
import type { ApiResponse, StockMovement, StockTakeSession } from '@qesuite/types'

export function apiGetStockMovements(productId?: string): Promise<ApiResponse<StockMovement[]>> {
  return api.get(`/api/stock/movements${productId ? `?product_id=${productId}` : ''}`)
}

export function apiRequestStockAdjustment(payload: { product_id: string; quantity_delta: number; reason: string }): Promise<ApiResponse<{ id: string }>> {
  return api.post('/api/stock/adjustments', payload)
}

export function apiGetStockTakeSessions(): Promise<ApiResponse<StockTakeSession[]>> {
  return api.get('/api/stock/take')
}

export function apiGetStockTakeSession(id: string): Promise<ApiResponse<StockTakeSession>> {
  return api.get(`/api/stock/take/${id}`)
}

export function apiOpenStockTake(notes?: string): Promise<ApiResponse<{ id: string }>> {
  return api.post('/api/stock/take/open', { notes })
}

export function apiRecordStockTakeCounts(
  sessionId: string,
  counts: { product_id: string; counted_quantity: number; reason?: string }[],
): Promise<ApiResponse<{ session_id: string }>> {
  return api.post(`/api/stock/take/${sessionId}/count`, { counts })
}

export function apiCloseStockTake(sessionId: string): Promise<ApiResponse<{ id: string; corrections: number }>> {
  return api.post(`/api/stock/take/${sessionId}/close`, {})
}
