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

export interface LoginPayload {
  identifier: string
  password: string
}

export async function apiLogin(payload: LoginPayload): Promise<ApiResponse<AuthData>> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
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

export async function apiUpdateMe(payload: UpdateProfileRequest): Promise<ApiResponse<null>> {
  return apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}


export async function apiLogout(): Promise<ApiResponse<null>> {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}
