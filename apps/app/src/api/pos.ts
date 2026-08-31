import { apiFetch } from './index'
import type {
  ApiResponse,
  PosCashMovementType,
  PosSale,
  PosSaleItem,
  PosSaleCreate,
  PosTillSession,
} from '@qesuite/types'

interface RawPosListResponse {
  data: { items: PosSale[]; total: number; page: number; limit: number } | null
  error: string | null
}

export async function apiGetPosSales(params?: {
  status?: string; from?: string; to?: string; page?: number; limit?: number
}): Promise<{ items: PosSale[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const q = qs.toString()
  const raw = await apiFetch<RawPosListResponse>(`/api/pos${q ? `?${q}` : ''}`)
  return raw.data ?? { items: [], total: 0, page: 1, limit: 20 }
}

interface RawPosDetailResponse {
  data: { sale: PosSale; items: PosSaleItem[] } | null
  error: string | null
}

export async function apiGetPosSale(id: string): Promise<{ sale: PosSale; items: PosSaleItem[] } | null> {
  const raw = await apiFetch<RawPosDetailResponse>(`/api/pos/${id}`)
  return raw.data ?? null
}

export interface PosSaleResult {
  sale_id: string
  receipt_code: string
  subtotal: number
  discount: number
  total: number
  payment_method: PosSale['payment_method']
  amount_tendered: number | null
  change_due: number | null
  till_session_id: string
  running_float: number
  items: PosSaleItem[]
}

// A credit sale that would exceed the customer's limit doesn't ring up
// immediately — it's queued for a manager to approve (see Approvals).
export interface PosSalePendingApproval {
  pending_approval: true
  approval_id: string
  customer_name: string
  total: number
}

export async function apiCreatePosSale(payload: PosSaleCreate): Promise<ApiResponse<PosSaleResult | PosSalePendingApproval>> {
  return apiFetch('/api/pos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function apiVoidPosSale(id: string, reason: string): Promise<ApiResponse<{
  id: string
  status: string
  running_float?: number
}>> {
  return apiFetch(`/api/pos/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function apiGetCurrentTill(): Promise<PosTillSession | null> {
  const response = await apiFetch<ApiResponse<PosTillSession | null>>('/api/pos/till/current')
  return response.data ?? null
}

export async function apiGetTillHistory(): Promise<PosTillSession[]> {
  const response = await apiFetch<ApiResponse<PosTillSession[]>>('/api/pos/till/history')
  return response.data ?? []
}

export async function apiOpenTill(payload: {
  opening_float: number
  business_date: string
}): Promise<ApiResponse<PosTillSession>> {
  return apiFetch('/api/pos/till/open', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function apiRecordCashMovement(payload: {
  movement_type: Extract<PosCashMovementType, 'paid_in' | 'paid_out' | 'correction'>
  amount: number
  reason: string
  record_as_expense?: boolean
  expense_category?: string
}): Promise<ApiResponse<PosTillSession>> {
  return apiFetch('/api/pos/till/movements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface PosTillCloseResult {
  id: string
  counted_cash: number
  expected_cash: number
  variance: number
}

export async function apiCloseTill(countedCash: number): Promise<ApiResponse<PosTillCloseResult>> {
  return apiFetch('/api/pos/till/close', {
    method: 'POST',
    body: JSON.stringify({ counted_cash: countedCash }),
  })
}

export interface PosReport {
  date_from: string
  date_to: string
  revenue: number
  expenses: number
  profit_loss: number
  expense_count: number
  expenses_by_category: Array<{ category: string; total: number; count: number }>
  sale_count: number
  voided_count: number
  by_payment_method: Array<{ payment_method: string; sale_count: number; revenue: number }>
  top_items: Array<{ product_name: string; total_quantity: number; total_revenue: number }>
}

export async function apiGetPosReport(params?: { period?: string; from?: string; to?: string }): Promise<ApiResponse<PosReport>> {
  const qs = new URLSearchParams()
  if (params?.period) qs.set('period', params.period)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const q = qs.toString()
  return apiFetch(`/api/pos/report${q ? `?${q}` : ''}`)
}
