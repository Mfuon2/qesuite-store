import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setTokens, clearTokens, getAccessToken } from '@/api/index'
import { apiLogin, apiRegister, apiGetMe, apiLogout } from '@/api/auth'
import { verifyMagicLinkApi, requestMagicLinkApi } from '@/api/delivery'
import { adminLogin, type AdminUser } from '@/api/admin'
import type { PublicUser } from '@qesuite/types'
import type { RegisterRequest } from '@/api/auth'

export type UserRole = 'owner' | 'rider' | 'superadmin'

export interface AppUser {
  id: string
  name: string
  role: UserRole
  tenant_id: string | null
  email?: string
  phone?: string
}

function parseJwt(token: string): { exp: number; tenant_id: string | null; role: string } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AppUser | null>(null)
  const token = ref<string | null>(sessionStorage.getItem('access_token'))
  const onboardingComplete = ref<boolean>(sessionStorage.getItem('onboarding_complete') === 'true')
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed<UserRole | null>(() => {
    if (!token.value) return null
    const payload = parseJwt(token.value)
    return (payload?.role as UserRole) ?? null
  })

  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleRefresh(accessToken: string) {
    if (refreshTimer) clearTimeout(refreshTimer)
    const payload = parseJwt(accessToken)
    if (!payload) return
    const expiresIn = (payload.exp * 1000) - Date.now() - 60_000
    if (expiresIn > 0) {
      refreshTimer = setTimeout(async () => {
        await refreshOwnerToken()
      }, expiresIn)
    }
  }

  async function refreshOwnerToken() {
    try {
      const base = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${base}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) { logout(); return }
      const data = await res.json()
      if (data.success && data.data) {
        token.value = data.data.access_token
        setTokens(data.data.access_token)
        scheduleRefresh(data.data.access_token)
      } else {
        logout()
      }
    } catch { /* network error, keep existing token */ }
  }

  // ─── Owner login ─────────────────────────────────────────────────
  async function login(credential: string, password: string) {
    loading.value = true
    try {
      const res = await apiLogin({ identifier: credential, password })
      if (!res.success || !res.data) throw new Error(res.error || 'Login failed')
      const { user: u, access_token } = res.data
      user.value = { id: u.id, name: u.name, role: u.role as UserRole, tenant_id: u.tenant_id ?? null }
      token.value = access_token
      setTokens(access_token)
      scheduleRefresh(access_token)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterRequest) {
    loading.value = true
    try {
      const res = await apiRegister(payload)
      if (!res.success || !res.data) throw new Error(res.error || 'Registration failed')
      const { user: u, access_token } = res.data
      user.value = { id: u.id, name: u.name, role: u.role as UserRole, tenant_id: u.tenant_id ?? null }
      token.value = access_token
      setTokens(access_token)
      onboardingComplete.value = false
      sessionStorage.setItem('onboarding_complete', 'false')
      scheduleRefresh(access_token)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' }
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value || role.value !== 'owner') return
    try {
      const res = await apiGetMe()
      if (res.success && res.data) {
        const u = res.data as PublicUser
        user.value = { id: u.id, name: u.name, role: u.role as UserRole, tenant_id: u.tenant_id ?? null }
      }
    } catch { /* ignore */ }
  }

  // ─── Rider magic link ────────────────────────────────────────────
  async function requestRiderLink(phone: string) {
    await requestMagicLinkApi(phone)
  }

  async function verifyRiderLink(magicToken: string) {
    loading.value = true
    try {
      const result = await verifyMagicLinkApi(magicToken)
      token.value = result.access_token
      user.value = {
        id: result.user.id,
        name: result.user.name,
        role: 'rider',
        tenant_id: result.user.tenant_id,
      }
      setTokens(result.access_token)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' }
    } finally {
      loading.value = false
    }
  }

  // ─── Superadmin login ────────────────────────────────────────────
  async function adminSignIn(email: string, password: string) {
    loading.value = true
    try {
      const result = await adminLogin(email, password)
      token.value = result.token
      const u = result.user as AdminUser
      const adminUser = { id: u.id, name: u.name, role: 'superadmin' as const, tenant_id: null, email: u.email }
      user.value = adminUser
      setTokens(result.token)
      sessionStorage.setItem('admin_user', JSON.stringify(adminUser))
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  // ─── Shared ──────────────────────────────────────────────────────
  function setOnboardingComplete(val: boolean) {
    onboardingComplete.value = val
    sessionStorage.setItem('onboarding_complete', String(val))
  }

  async function logout() {
    if (role.value === 'owner') {
      try { await apiLogout() } catch { /* ignore */ }
    }
    user.value = null
    token.value = null
    onboardingComplete.value = false
    clearTokens()
    sessionStorage.removeItem('onboarding_complete')
    sessionStorage.removeItem('admin_user')
    if (refreshTimer) clearTimeout(refreshTimer)
  }

  // Restore session on init
  if (token.value) {
    const r = parseJwt(token.value)?.role
    if (r === 'owner') {
      scheduleRefresh(token.value)
      fetchMe()
    } else if (r === 'superadmin') {
      const saved = sessionStorage.getItem('admin_user')
      if (saved) {
        try { user.value = { ...JSON.parse(saved), role: 'superadmin' } } catch { /* ignore */ }
      }
    } else if (r === 'rider') {
      const saved = sessionStorage.getItem('rider_info')
      if (saved) {
        try {
          const riderInfo = JSON.parse(saved)
          user.value = { ...riderInfo, role: 'rider' }
        } catch { /* ignore */ }
      }
    }
  }

  return {
    user,
    token,
    role,
    isAuthenticated,
    onboardingComplete,
    loading,
    login,
    register,
    logout,
    fetchMe,
    setOnboardingComplete,
    requestRiderLink,
    verifyRiderLink,
    adminSignIn,
    getAccessToken,
  }
})
