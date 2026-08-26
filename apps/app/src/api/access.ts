import { apiFetch } from './index'
import type { ApiResponse, CurrentAccess, StaffInvitation, StoreMember } from '@qesuite/types'

export interface PermissionCatalog {
  groups: Array<{
    id: string
    label: string
    description: string
    permissions: Array<{ key: string; label: string; operation: string }>
  }>
  presets: Record<string, readonly string[]>
}

export interface StaffAccessInput {
  name: string
  email: string
  phone?: string | null
  job_title?: string | null
  permissions: string[]
}

export interface InvitationPreview {
  name: string
  email: string
  phone: string | null
  job_title: string | null
  store_name: string
  status: string
  expires_at: string
}

export const apiGetCurrentAccess = () => apiFetch<ApiResponse<CurrentAccess>>('/api/access/me')
export const apiGetAccessCatalog = () => apiFetch<ApiResponse<PermissionCatalog>>('/api/access/catalog')
export const apiGetMembers = () => apiFetch<ApiResponse<StoreMember[]>>('/api/access/members')
export const apiGetInvitations = () => apiFetch<ApiResponse<StaffInvitation[]>>('/api/access/invitations')

export function apiCreateInvitation(input: StaffAccessInput): Promise<ApiResponse<{ id: string; invite_url: string; expires_at: string }>> {
  return apiFetch('/api/access/invitations', { method: 'POST', body: JSON.stringify(input) })
}

export function apiRenewInvitation(id: string): Promise<ApiResponse<{ invite_url: string; expires_at: string }>> {
  return apiFetch(`/api/access/invitations/${id}/renew`, { method: 'POST' })
}

export function apiRevokeInvitation(id: string): Promise<ApiResponse<null>> {
  return apiFetch(`/api/access/invitations/${id}`, { method: 'DELETE' })
}

export function apiUpdateMember(id: string, input: StaffAccessInput): Promise<ApiResponse<{ id: string; permissions: string[] }>> {
  return apiFetch(`/api/access/members/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function apiSetMemberStatus(id: string, isActive: boolean): Promise<ApiResponse<{ id: string; is_active: boolean }>> {
  return apiFetch(`/api/access/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) })
}

export function apiGetInvitation(token: string): Promise<ApiResponse<InvitationPreview>> {
  return apiFetch(`/api/access/invitations/accept/${encodeURIComponent(token)}`)
}

export function apiAcceptInvitation(token: string, password: string): Promise<ApiResponse<{ email: string }>> {
  return apiFetch(`/api/access/invitations/accept/${encodeURIComponent(token)}`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}
