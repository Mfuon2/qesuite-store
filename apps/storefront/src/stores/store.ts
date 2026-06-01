import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStore, getProducts, getCategories } from '@/api/storefront'
import type { StorefrontConfig, Product, Category } from '@qesuite/types'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number }
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

function writeCache<T>(key: string, data: T) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch { /* quota */ }
}

export const useStorefrontStore = defineStore('storefront', () => {
  const config = ref<StorefrontConfig | null>(null)
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const productsLoading = ref(false)
  const error = ref<string | null>(null)
  const notFound = ref(false)
  const slug = ref<string>('')
  const activeCategoryId = ref<string | null>(null)
  const searchQuery = ref('')
  const mobileFilterOpen = ref(false)
  const mobileMenuOpen = ref(false)

  // ── User location ────────────────────────────────────────────
  type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  const userLat = ref<number | null>(null)
  const userLng = ref<number | null>(null)
  const locationStatus = ref<LocationStatus>('idle')
  const userAddress = ref<string | null>(null) // reverse-geocoded human-readable address

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'QeSuite/1.0' } }
      )
      const data = await res.json() as {
        display_name?: string
        address?: { road?: string; suburb?: string; neighbourhood?: string; city?: string; county?: string; country?: string }
      }
      if (data.address) {
        const a = data.address
        userAddress.value = [a.road, a.suburb ?? a.neighbourhood, a.city ?? a.county]
          .filter(Boolean).join(', ')
      } else if (data.display_name) {
        userAddress.value = data.display_name.split(',').slice(0, 3).join(',').trim()
      }
    } catch { /* reverse geocoding is best-effort */ }
  }

  async function requestLocation() {
    if (!navigator.geolocation) { locationStatus.value = 'unavailable'; return }
    if (locationStatus.value === 'granted' || locationStatus.value === 'requesting') return
    locationStatus.value = 'requesting'
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 5 * 60_000, // reuse cached fix for 5 min
        })
      )
      userLat.value = pos.coords.latitude
      userLng.value = pos.coords.longitude
      locationStatus.value = 'granted'
      reverseGeocode(pos.coords.latitude, pos.coords.longitude) // non-blocking
    } catch (e) {
      const err = e as GeolocationPositionError
      locationStatus.value = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'
    }
  }

  const isSuspended = computed(() => {
    const t = config.value?.tenant
    if (!t) return false
    if (t.is_suspended) return true
    const status = t.subscription_status
    if (status === 'active') return false
    if (status === 'trialing') {
      if (!t.trial_ends_at) return true
      return new Date(t.trial_ends_at) < new Date()
    }
    return true // cancelled, expired, or unknown — treat as inaccessible
  })
  const storeName = computed(() => config.value?.tenant.name ?? '')
  const currency = computed(() => config.value?.settings.currency ?? 'KES')
  const deliveryFee = computed(() => config.value?.settings.delivery_fee ?? 0)
  const deliveryEnabled = computed(() => config.value?.settings.delivery_enabled ?? true)
  const pickupEnabled = computed(() => config.value?.settings.pickup_enabled ?? false)
  const estimatedMinutes = computed(() => config.value?.settings.estimated_delivery_minutes ?? 30)
  const minOrderAmount = computed(() => config.value?.settings.min_order_amount ?? 0)
  const whatsappNumber = computed(() => config.value?.tenant.whatsapp_number ?? null)

  const featuredProducts = computed(() =>
    products.value.filter((p) => p.featured && p.is_active)
  )

  const activeProducts = computed(() =>
    products.value.filter((p) => p.is_active)
  )

  function applyBranding(cfg: StorefrontConfig) {
    const { primary_color, accent_color, font_family } = cfg.tenant
    const root = document.documentElement
    if (primary_color) root.style.setProperty('--color-primary', primary_color)
    if (accent_color) root.style.setProperty('--color-accent', accent_color)
    if (font_family) {
      root.style.setProperty('--font-family', `'${font_family}', sans-serif`)
    }
    // Update theme-color meta
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme && primary_color) metaTheme.setAttribute('content', primary_color)
    // Update page title
    if (cfg.tenant.name) document.title = cfg.tenant.name
  }

  async function fetchStore(storeSlug: string) {
    slug.value = storeSlug
    error.value = null
    notFound.value = false

    const cacheKey = `sf_config_${storeSlug}`
    const cached = readCache<StorefrontConfig>(cacheKey)
    if (cached) {
      config.value = cached
      applyBranding(cached)
      // Revalidate in background
      getStore(storeSlug).then((data) => {
        config.value = data
        applyBranding(data)
        writeCache(cacheKey, data)
      }).catch(() => {})
      return
    }

    loading.value = true
    try {
      const data = await getStore(storeSlug)
      config.value = data
      applyBranding(data)
      writeCache(cacheKey, data)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string }
      if (apiErr?.status === 404) {
        notFound.value = true
      } else {
        error.value = apiErr?.message || 'Failed to load store'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    if (!slug.value) return
    const cacheKey = `sf_cats_${slug.value}`
    const cached = readCache<Category[]>(cacheKey)
    if (cached) {
      categories.value = cached
      getCategories(slug.value).then((data) => { categories.value = data; writeCache(cacheKey, data) }).catch(() => {})
      return
    }
    try {
      const data = await getCategories(slug.value)
      categories.value = data
      writeCache(cacheKey, data)
    } catch {
      categories.value = []
    }
  }

  async function fetchProducts(categoryId?: string) {
    if (!slug.value) return
    const cacheKey = `sf_prods_${slug.value}${categoryId ? `_${categoryId}` : ''}`
    const cached = readCache<Product[]>(cacheKey)
    if (cached) {
      products.value = cached
      // Revalidate in background — images already in browser cache, data stays fresh
      getProducts(slug.value, categoryId).then((data) => { products.value = data; writeCache(cacheKey, data) }).catch(() => {})
      return
    }

    productsLoading.value = true
    try {
      const data = await getProducts(slug.value, categoryId)
      products.value = data
      writeCache(cacheKey, data)
    } catch {
      products.value = []
    } finally {
      productsLoading.value = false
    }
  }

  function invalidateCache() {
    try {
      const keys = Object.keys(sessionStorage).filter(k =>
        k.startsWith('sf_config_') || k.startsWith('sf_cats_') || k.startsWith('sf_prods_')
      )
      keys.forEach(k => sessionStorage.removeItem(k))
    } catch { /* ignore */ }
  }

  function setActiveCategory(id: string | null) {
    activeCategoryId.value = id
  }

  function setSearchQuery(value: string) {
    searchQuery.value = value
  }

  function openMobileFilters() {
    mobileFilterOpen.value = true
  }

  function closeMobileFilters() {
    mobileFilterOpen.value = false
  }

  function openMobileMenu() {
    mobileMenuOpen.value = true
  }

  function closeMobileMenu() {
    mobileMenuOpen.value = false
  }

  return {
    config,
    products,
    categories,
    loading,
    productsLoading,
    error,
    notFound,
    slug,
    activeCategoryId,
    searchQuery,
    mobileFilterOpen,
    mobileMenuOpen,
    isSuspended,
    // Location
    userLat,
    userLng,
    locationStatus,
    userAddress,
    requestLocation,
    storeName,
    currency,
    deliveryFee,
    deliveryEnabled,
    pickupEnabled,
    estimatedMinutes,
    minOrderAmount,
    whatsappNumber,
    featuredProducts,
    activeProducts,
    fetchStore,
    fetchCategories,
    fetchProducts,
    invalidateCache,
    applyBranding,
    setActiveCategory,
    setSearchQuery,
    openMobileFilters,
    closeMobileFilters,
    openMobileMenu,
    closeMobileMenu,
  }
})
