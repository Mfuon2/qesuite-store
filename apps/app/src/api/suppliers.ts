import api from './index'
import type { ApiResponse, Supplier } from '@qesuite/types'

export type SupplierInput = { name: string; phone?: string; email?: string; address?: string; notes?: string }

export function apiGetSuppliers(includeInactive = false): Promise<ApiResponse<Supplier[]>> {
  return api.get(`/api/suppliers${includeInactive ? '?include_inactive=1' : ''}`)
}

export function apiCreateSupplier(payload: SupplierInput): Promise<ApiResponse<{ id: string }>> {
  return api.post('/api/suppliers', payload)
}

export function apiUpdateSupplier(id: string, payload: Partial<SupplierInput> & { is_active?: boolean }): Promise<ApiResponse<{ id: string }>> {
  return api.put(`/api/suppliers/${id}`, payload)
}

export function apiDeactivateSupplier(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.delete(`/api/suppliers/${id}`)
}
