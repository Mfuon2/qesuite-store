import { apiFetch } from './index'
import type { ApiResponse, PublicUser } from '@qesuite/types'

export interface RegisterRequest {
  name: string
  email?: string
  phone?: string
  password: string
  store_name: string
}

export interface AuthData {
  access_token: string
  user: Pick<PublicUser, 'id' | 'name' | 'role' | 'tenant_id'>
  store?: { slug: string; name?: string } | null
}

export interface StoreChoice {
  tenant_id: string
  user_id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
}

export interface StoreSelectionData {
  requires_store_selection: true
  selection_token: string
  stores: StoreChoice[]
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface ResolveData {
  next: 'password' | 'magic_link_sent'
}

export async function apiResolveIdentifier(identifier: string): Promise<ApiResponse<ResolveData>> {
  return apiFetch('/api/auth/resolve', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  })
}

export async function apiLogin(
  payload: LoginPayload
): Promise<ApiResponse<AuthData | StoreSelectionData>> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function apiSelectStore(
  selectionToken: string,
  tenantId: string
): Promise<ApiResponse<AuthData>> {
  return apiFetch('/api/auth/select-store', {
    method: 'POST',
    body: JSON.stringify({ selection_token: selectionToken, tenant_id: tenantId }),
  })
}

export async function apiRegister(payload: RegisterRequest): Promise<ApiResponse<AuthData>> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiGetMe(): Promise<ApiResponse<PublicUser & { tenant_slug?: string }>> {
  return apiFetch('/api/auth/me')
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  phone?: string
  current_password?: string
  new_password?: string
}

export async function apiUpdateMe(payload: UpdateProfileRequest): Promise<ApiResponse<PublicUser | null>> {
  return apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}


export async function apiCheckStoreName(name: string): Promise<ApiResponse<{ available: boolean; slug: string }>> {
  return apiFetch(`/api/auth/check-store-name?name=${encodeURIComponent(name)}`)
}

export async function apiLogout(): Promise<ApiResponse<null>> {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}
