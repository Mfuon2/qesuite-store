import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStore, getProducts, getCategories } from '@/api/storefront'
import type { StorefrontConfig, Product, Category } from '@qesuite/types'

export const useStorefrontStore = defineStore('storefront', () => {
  const config = ref<StorefrontConfig | null>(null)
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const productsLoading = ref(false)
  const error = ref<string | null>(null)
  const notFound = ref(false)
  const slug = ref<string>('')

  const isSuspended = computed(() => config.value?.tenant.is_suspended ?? false)
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
    loading.value = true
    error.value = null
    notFound.value = false

    try {
      const data = await getStore(storeSlug)
      config.value = data
      applyBranding(data)
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
    try {
      categories.value = await getCategories(slug.value)
    } catch {
      categories.value = []
    }
  }

  async function fetchProducts(categoryId?: string) {
    if (!slug.value) return
    productsLoading.value = true
    try {
      products.value = await getProducts(slug.value, categoryId)
    } catch {
      products.value = []
    } finally {
      productsLoading.value = false
    }
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
    isSuspended,
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
    applyBranding,
  }
})
