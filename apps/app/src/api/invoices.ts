import api from './index'
import type { ApiResponse, Invoice, ArAgingRow, InvoiceType } from '@qesuite/types'

export type InvoiceItemInput = { product_id?: string; description: string; quantity: number; unit_price: number }
export type InvoiceInput = {
  type: InvoiceType
  customer_name: string
  customer_phone?: string
  customer_pin?: string
  discount?: number
  tax_amount?: number
  payment_terms_days?: number
  recurring_interval?: 'weekly' | 'monthly'
  notes?: string
  items: InvoiceItemInput[]
}

export function apiGetInvoices(filters?: { status?: string; type?: string; customer_id?: string }): Promise<ApiResponse<Invoice[]>> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.customer_id) params.set('customer_id', filters.customer_id)
  const qs = params.toString()
  return api.get(`/api/invoices${qs ? `?${qs}` : ''}`)
}

export function apiGetInvoice(id: string): Promise<ApiResponse<Invoice>> {
  return api.get(`/api/invoices/${id}`)
}

export function apiGetArAging(): Promise<ApiResponse<ArAgingRow[]>> {
  return api.get('/api/invoices/ar-aging')
}

export function apiCreateInvoice(payload: InvoiceInput): Promise<ApiResponse<{ id: string }>> {
  return api.post('/api/invoices', payload)
}

export function apiUpdateInvoice(id: string, payload: InvoiceInput): Promise<ApiResponse<{ id: string }>> {
  return api.put(`/api/invoices/${id}`, payload)
}

export function apiSendInvoice(id: string): Promise<ApiResponse<{ id: string; invoice_number: string }>> {
  return api.post(`/api/invoices/${id}/send`, {})
}

export function apiVoidInvoice(id: string, reason?: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/invoices/${id}/void`, { reason })
}

export function apiRecordInvoicePayment(id: string, payload: { amount: number; method: string; reference?: string; note?: string }): Promise<ApiResponse<{ id: string; status: string }>> {
  return api.post(`/api/invoices/${id}/payments`, payload)
}

export function apiRequestWriteOff(id: string, reason: string): Promise<ApiResponse<{ approval_id: string }>> {
  return api.post(`/api/invoices/${id}/write-off`, { reason })
}

export function apiIssueCreditNote(id: string, payload: { amount: number; reason?: string }): Promise<ApiResponse<{ id: string; credit_note_number: string }>> {
  return api.post(`/api/invoices/${id}/credit-notes`, payload)
}
