import type { ApiResponse } from '@qesuite/types'
import { beginNetworkActivity, endNetworkActivity } from '@/composables/useNetworkActivity'

// In dev, Vite proxies /api, /admin, /auth, /delivery to localhost:8787 automatically.
// In production, set VITE_API_URL to the deployed worker URL.
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Access token lives in memory only — never written to localStorage or sessionStorage.
// This prevents XSS-based token theft from persistent storage.
// Session continuity across page reloads is handled by the HTTP-only refresh token cookie:
// on mount, auth.ts calls refreshOwnerToken() which silently re-hydrates the memory token.
let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setTokens(access: string) {
  accessToken = access
  // Do NOT persist the access token to any browser storage
}

export function clearTokens() {
  accessToken = null
  sessionStorage.removeItem('onboarding_complete')
}

export function getAccessToken() {
  return accessToken
}

function getRoleFromToken(token: string): string | null {
  try {
    return JSON.parse(atob(token.split('.')[1])).role ?? null
  } catch {
    return null
  }
}

async function doRefresh(): Promise<string | null> {
  const activity = beginNetworkActivity('Refreshing session')
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) { clearTokens(); return null }
    const data = await res.json() as ApiResponse<{ access_token: string }>
    if (data.success && data.data) {
      setTokens(data.data.access_token)
      return data.data.access_token
    }
    clearTokens()
    return null
  } catch {
    clearTokens()
    return null
  } finally {
    endNetworkActivity(activity)
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const activity = beginNetworkActivity(labelForRequest(path, options.method))
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
    const role = getRoleFromToken(accessToken)
    if (role === 'superadmin') headers['X-Admin-Request'] = '1'
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' })

    // Only treat 401 as "session expired" when there is an active token.
    // A 401 on a public endpoint (e.g. /login with wrong password) has no token,
    // so it should fall through to the normal error handler below.
    if (res.status === 401 && retry && accessToken) {
      const role = getRoleFromToken(accessToken)
      if (role === 'owner') {
        const newToken = await refreshAccessToken()
        if (!newToken) {
          clearTokens()
          window.location.href = '/login'
          throw new Error('Session expired')
        }
        return await apiFetch<T>(path, options, false)
      }
      clearTokens()
      window.location.href = '/login'
      throw new Error('Session expired')
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error((errBody as { error?: string }).error || `HTTP ${res.status}`)
    }

    return res.json() as Promise<T>
  } finally {
    endNetworkActivity(activity)
  }
}

export async function apiUpload(path: string, file: File, onProgress?: (pct: number) => void): Promise<ApiResponse<{ url: string }>> {
  const activity = beginNetworkActivity('Uploading image')
  try {
    const presignRes = await apiFetch<ApiResponse<{ upload_url: string; public_url: string }>>(
      `${path}?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`
    )
    if (!presignRes.success || !presignRes.data) throw new Error('Failed to get upload URL')
    const { upload_url, public_url } = presignRes.data

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      })
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload failed: ${xhr.status}`))
      })
      xhr.addEventListener('error', () => reject(new Error('Upload network error')))
      xhr.open('PUT', upload_url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    return { success: true, data: { url: public_url } }
  } finally {
    endNetworkActivity(activity)
  }
}

function labelForRequest(path: string, method = 'GET') {
  const verb = method.toUpperCase()
  if (path.includes('/upload')) return 'Preparing upload'
  if (path.includes('/auth/login')) return 'Signing you in'
  if (path.includes('/auth/register')) return 'Creating your account'
  if (path.includes('/settings/onboarding')) return 'Launching your store'
  if (verb === 'GET') return 'Loading latest data'
  if (verb === 'DELETE') return 'Removing item'
  return 'Saving changes'
}

// Convenience wrapper for admin/delivery stores that use api.get/post/put/delete
export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    apiFetch<T>(path, { method: 'GET', ...options }),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(path: string, options?: RequestInit) =>
    apiFetch<T>(path, { method: 'DELETE', ...options }),
}

export default api
