import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGetTenant, apiUpdateTenant, apiGetStoreSettings, apiUpdateStoreSettings } from '@/api/settings'
import type { Tenant, StoreSettings, StoreSettingsUpdate } from '@qesuite/types'
import type { TenantUpdate } from '@/api/settings'
import { useToast } from '@/composables/useToast'

export const useSettingsStore = defineStore('settings', () => {
  const tenant = ref<Tenant | null>(null)
  const storeSettings = ref<StoreSettings | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  // Local UI preferences (not from API)
  const darkMode = ref(localStorage.getItem('dark_mode') === 'true')
  const orderView = ref<'kanban' | 'list'>(
    (localStorage.getItem('order_view') as 'kanban' | 'list') || 'kanban'
  )
  const soundEnabled = ref(localStorage.getItem('sound_enabled') !== 'false')

  const trialDaysLeft = computed(() => {
    if (!tenant.value?.trial_ends_at) return null
    const diff = new Date(tenant.value.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  const isTrialing = computed(() => tenant.value?.subscription_status === 'trialing')

  async function fetchTenant() {
    loading.value = true
    try {
      const res = await apiGetTenant()
      if (res.success && res.data) {
        tenant.value = res.data
        applyBranding(res.data)
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load tenant', 'error')
    } finally {
      loading.value = false
    }
  }

  async function fetchStoreSettings() {
    try {
      const res = await apiGetStoreSettings()
      if (res.success && res.data) {
        storeSettings.value = res.data
        // Sync dark mode & order view from server settings
        darkMode.value = res.data.dark_mode_enabled
        orderView.value = res.data.order_view === 'table' ? 'list' : res.data.order_view
        localStorage.setItem('dark_mode', String(res.data.dark_mode_enabled))
        localStorage.setItem('order_view', orderView.value)
      }
    } catch { /* ignore */ }
  }

  async function updateTenant(payload: TenantUpdate): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiUpdateTenant(payload)
      if (res.success && res.data) {
        tenant.value = res.data
        applyBranding(res.data)
        showToast('Store settings saved', 'success')
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateStoreSettings(payload: StoreSettingsUpdate): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiUpdateStoreSettings(payload)
      if (res.success && res.data) {
        storeSettings.value = res.data
        showToast('Settings saved', 'success')
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  function applyBranding(t: Tenant) {
    document.documentElement.style.setProperty('--color-primary', t.primary_color)
    document.documentElement.style.setProperty('--color-accent', t.accent_color)
    document.documentElement.style.setProperty('--font-family', `'${t.font_family}', sans-serif`)
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    localStorage.setItem('dark_mode', String(darkMode.value))
  }

  function setOrderView(view: 'kanban' | 'list') {
    orderView.value = view
    localStorage.setItem('order_view', view)
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('sound_enabled', String(soundEnabled.value))
  }

  return {
    tenant,
    storeSettings,
    loading,
    saving,
    darkMode,
    orderView,
    soundEnabled,
    trialDaysLeft,
    isTrialing,
    fetchTenant,
    fetchStoreSettings,
    updateTenant,
    updateStoreSettings,
    applyBranding,
    toggleDarkMode,
    setOrderView,
    toggleSound
  }
})
