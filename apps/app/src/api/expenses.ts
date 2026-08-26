import { apiFetch } from './index'
import type { ApiResponse, Expense, ExpenseCreate } from '@qesuite/types'

interface RawExpensesListResponse {
  data: { items: Expense[]; total: number; page: number; limit: number } | null
  error: string | null
}

export async function apiGetExpenses(params?: {
  category?: string; from?: string; to?: string; page?: number; limit?: number
}): Promise<{ items: Expense[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const q = qs.toString()
  const raw = await apiFetch<RawExpensesListResponse>(`/api/expenses${q ? `?${q}` : ''}`)
  return raw.data ?? { items: [], total: 0, page: 1, limit: 20 }
}

export async function apiCreateExpense(payload: ExpenseCreate): Promise<ApiResponse<Expense>> {
  return apiFetch('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function apiDeleteExpense(id: string): Promise<ApiResponse<{ id: string }>> {
  return apiFetch(`/api/expenses/${id}`, { method: 'DELETE' })
}

export interface ExpenseSummary {
  date_from: string
  date_to: string
  total: number
  expense_count: number
  by_category: Array<{ category: string; total: number; cnt: number }>
}

export async function apiGetExpenseSummary(params?: { period?: string; from?: string; to?: string }): Promise<ApiResponse<ExpenseSummary>> {
  const qs = new URLSearchParams()
  if (params?.period) qs.set('period', params.period)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const q = qs.toString()
  return apiFetch(`/api/expenses/summary${q ? `?${q}` : ''}`)
}
