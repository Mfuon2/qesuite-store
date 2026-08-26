import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setTokens, clearTokens, getAccessToken, apiFetch } from '@/api/index'
import { apiLogin, apiRegister, apiGetMe, apiLogout, apiSelectStore, apiUpdateMe, apiResolveIdentifier } from '@/api/auth'
import type { StoreChoice, StoreSelectionData, UpdateProfileRequest } from '@/api/auth'
import { verifyMagicLinkApi, requestMagicLinkApi, selectRiderStoreApi } from '@/api/delivery'
import type { VerifyResponse, RiderStoreSelectionData } from '@/api/delivery'
import { adminLogin, type AdminUser } from '@/api/admin'
import { beginNetworkActivity, endNetworkActivity } from '@/composables/useNetworkActivity'
import type { PublicUser } from '@qesuite/types'
import type { RegisterRequest } from '@/api/auth'
import { useAccessStore } from '@/stores/access'

export type UserRole = 'owner' | 'staff' | 'rider' | 'superadmin'

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
  // Access token lives in memory only — rehydrated from HTTP-only cookie via refreshOwnerToken()
  const token = ref<string | null>(null)
  const onboardingComplete = ref<boolean>(sessionStorage.getItem('onboarding_complete') === 'true')
  const loading = ref(false)
  // Resolves once the initial cookie-based rehydration attempt is complete.
  // The router guard awaits this before checking auth state on first load.
  let _readyResolve: () => void = () => {}
  const ready = new Promise<void>(r => { _readyResolve = r })

  // Multi-store selection state — set when login returns requires_store_selection
  const pendingStoreSelection = ref<StoreSelectionData | null>(null)
  // Same idea for a rider phone active at more than one tenant
  const pendingRiderStoreSelection = ref<RiderStoreSelectionData | null>(null)

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
    const activity = beginNetworkActivity('Refreshing session')
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
        await fetchMe()
      } else {
        logout()
      }
    } catch { /* network error, keep existing token */ }
    finally {
      endNetworkActivity(activity)
    }
  }

  // ─── Step 1 of login: identify without asking the user their role ──
  async function resolveIdentifier(identifier: string) {
    try {
      const res = await apiResolveIdentifier(identifier)
      if (!res.success || !res.data) throw new Error(res.error || 'Something went wrong')
      return { success: true as const, next: res.data.next }
    } catch (err: unknown) {
      return { success: false as const, error: err instanceof Error ? err.message : 'Something went wrong' }
    }
  }

  // ─── Owner login ─────────────────────────────────────────────────
  async function login(credential: string, password: string) {
    loading.value = true
    try {
      const res = await apiLogin({ identifier: credential, password })
      if (!res.success || !res.data) throw new Error(res.error || 'Login failed')

      // Multi-store: backend asks us to pick a store first
      if ('requires_store_selection' in res.data && res.data.requires_store_selection) {
        pendingStoreSelection.value = res.data as StoreSelectionData
        return { success: true, requires_store_selection: true }
      }

      await _finalizeLogin(res.data as { access_token: string; user: AppUser & { tenant_id: string | null } })
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function selectStore(tenantId: string) {
    if (!pendingStoreSelection.value) return { success: false, error: 'No pending selection' }
    loading.value = true
    try {
      const res = await apiSelectStore(pendingStoreSelection.value.selection_token, tenantId)
      if (!res.success || !res.data) throw new Error(res.error || 'Store selection failed')
      pendingStoreSelection.value = null
      await _finalizeLogin(res.data as { access_token: string; user: AppUser & { tenant_id: string | null } })
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Store selection failed' }
    } finally {
      loading.value = false
    }
  }

  async function _finalizeLogin(data: { access_token: string; user: AppUser & { tenant_id: string | null } }) {
    const { user: u, access_token } = data
    user.value = {
      id: u.id,
      name: u.name,
      role: u.role as UserRole,
      tenant_id: u.tenant_id ?? null,
      email: u.email,
      phone: u.phone,
    }
    token.value = access_token
    setTokens(access_token)
    scheduleRefresh(access_token)
    if (u.role === 'owner' && u.tenant_id) {
      try {
        const statusRes = await apiFetch<{ data: { complete: boolean } | null }>('/api/onboarding/status')
        if (statusRes.data?.complete) {
          onboardingComplete.value = true
          sessionStorage.setItem('onboarding_complete', 'true')
        }
      } catch { /* ignore */ }
    } else if (u.role === 'staff') {
      onboardingComplete.value = true
      sessionStorage.setItem('onboarding_complete', 'true')
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
    if (!token.value || !['owner', 'staff'].includes(role.value ?? '')) return
    try {
      const res = await apiGetMe()
      if (res.success && res.data) {
        const u = res.data as PublicUser
        user.value = {
          id: u.id,
          name: u.name,
          role: u.role as UserRole,
          tenant_id: u.tenant_id ?? null,
          email: u.email ?? undefined,
          phone: u.phone ?? undefined,
        }
      }
    } catch { /* ignore */ }
  }

  async function updateProfile(payload: UpdateProfileRequest) {
    const res = await apiUpdateMe(payload)
    if (!res.success) throw new Error(res.error || 'Failed to update personal information')
    await fetchMe()
    return user.value
  }

  // ─── Rider magic link ────────────────────────────────────────────
  async function requestRiderLink(phone: string) {
    await requestMagicLinkApi(phone)
  }

  function _finalizeRiderLogin(result: VerifyResponse) {
    token.value = result.access_token
    user.value = {
      id: result.user.id,
      name: result.user.name,
      role: 'rider',
      tenant_id: result.user.tenant_id,
    }
    setTokens(result.access_token)
  }

  async function verifyRiderLink(magicToken: string) {
    loading.value = true
    try {
      const result = await verifyMagicLinkApi(magicToken)
      if (!('user' in result)) {
        pendingRiderStoreSelection.value = result
        return { success: true, requires_store_selection: true }
      }
      _finalizeRiderLogin(result)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' }
    } finally {
      loading.value = false
    }
  }

  async function selectRiderStore(tenantId: string) {
    if (!pendingRiderStoreSelection.value) return { success: false, error: 'No pending selection' }
    loading.value = true
    try {
      const result = await selectRiderStoreApi(pendingRiderStoreSelection.value.verify_token, tenantId)
      pendingRiderStoreSelection.value = null
      _finalizeRiderLogin(result)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Store selection failed' }
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
      // Do NOT persist admin user object to sessionStorage — only keep a non-sensitive session marker
      sessionStorage.setItem('admin_session', '1')
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
    if (role.value === 'owner' || role.value === 'staff') {
      try { await apiLogout() } catch { /* ignore */ }
    }
    user.value = null
    token.value = null
    onboardingComplete.value = false
    clearTokens()
    sessionStorage.removeItem('onboarding_complete')
    sessionStorage.removeItem('admin_session')
    useAccessStore().reset()
    if (refreshTimer) clearTimeout(refreshTimer)
  }

  // Restore session on page load — silently re-hydrate from the HTTP-only refresh token cookie.
  // Access tokens are memory-only so there is nothing to restore from sessionStorage.
  if (sessionStorage.getItem('onboarding_complete') !== null) {
    // Likely a valid refresh cookie exists — rehydrate then mark ready
    refreshOwnerToken().finally(() => _readyResolve())
  } else {
    // No prior session marker — nothing to restore
    _readyResolve()
  }

  return {
    user,
    token,
    role,
    isAuthenticated,
    onboardingComplete,
    loading,
    ready,
    resolveIdentifier,
    login,
    selectStore,
    pendingStoreSelection,
    register,
    logout,
    fetchMe,
    updateProfile,
    setOnboardingComplete,
    requestRiderLink,
    verifyRiderLink,
    selectRiderStore,
    pendingRiderStoreSelection,
    adminSignIn,
    getAccessToken,
  }
})
