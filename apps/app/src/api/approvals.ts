import api from './index'
import type { ApiResponse, ApprovalRequest } from '@qesuite/types'

export function apiGetApprovals(status = 'pending'): Promise<ApiResponse<ApprovalRequest[]>> {
  return api.get(`/api/approvals?status=${status}`)
}

export function apiApproveRequest(id: string, note?: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/approvals/${id}/approve`, { note })
}

export function apiRejectRequest(id: string, note?: string): Promise<ApiResponse<{ id: string }>> {
  return api.post(`/api/approvals/${id}/reject`, { note })
}
