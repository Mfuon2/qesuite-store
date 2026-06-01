<template>
  <div class="min-h-screen bg-white text-slate-950">
    <!-- Success state -->
    <Transition name="fade">
      <div v-if="isComplete" class="relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-center">
        <div class="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(20,132,71,0.16),transparent_36rem)]"></div>
        <div class="qs-card-soft relative w-full max-w-xl p-6 sm:p-8">
          <div class="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[1.35rem] bg-emerald-700 shadow-[0_18px_42px_rgba(20,132,71,0.25)]">
            <CheckIcon class="h-10 w-10 text-white" />
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Your store is live</h1>
          <p class="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
            Your setup is complete. Share the storefront link with customers and start taking orders.
          </p>
          <div class="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-left">
            <LinkIcon class="h-5 w-5 shrink-0 text-emerald-700" />
            <span class="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-slate-700">{{ storefrontBase }}/{{ storeSlug }}</span>
            <button @click="copyLink" class="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <ClipboardDocumentIcon class="h-5 w-5" />
            </button>
          </div>
          <button
            @click="goToDashboard"
            class="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(20,132,71,0.22)] transition hover:bg-emerald-800"
          >
            Go to Dashboard <ArrowRightIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Wizard -->
    <div v-if="!isComplete" class="relative min-h-screen overflow-hidden">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_24%_0%,rgba(20,132,71,0.16),transparent_34rem)]"></div>

      <header class="relative mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <span class="qs-brand-mark shrink-0"></span>
          <div>
            <p class="text-base font-extrabold text-slate-950"><span class="text-emerald-700">Store</span> </p>
            <p class="text-xs font-semibold text-slate-500">Store setup</p>
          </div>
        </div>
        <div class="hidden items-center gap-2 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 text-xs font-bold text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:flex">
          <SparklesIcon class="h-4 w-4 text-emerald-700" />
          {{ Math.round(progressPct) }}% complete
        </div>
      </header>

      <main class="relative mx-auto grid max-w-[1500px] gap-5 px-4 pb-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside class="hidden lg:block">
          <div class="sticky top-5 space-y-4">
            <div class="qs-card-soft overflow-hidden p-0">
              <div class="relative h-40 overflow-hidden bg-white">
                <img
                  src="/qesuite-marketplace-reference.png"
                  alt=""
                  class="h-full w-full object-cover object-[48%_26%]"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-white via-white/35 to-white/5"></div>
                <div class="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
                <div class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
              </div>
              <div class="p-5">
                <h1 class="text-2xl font-extrabold tracking-tight text-slate-950">Launch your online store</h1>
                <p class="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Configure the essentials customers see first: identity, catalog, delivery, and checkout readiness.
                </p>
                <div class="mt-5 grid gap-3">
                  <div
                    v-for="item in journeyItems"
                    :key="item.label"
                    class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3"
                  >
                    <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <component :is="item.icon" class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-extrabold text-slate-800">{{ item.label }}</p>
                      <p class="text-xs font-medium text-slate-500">{{ item.value }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="qs-card-soft p-4">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm font-extrabold text-slate-950">Setup progress</p>
                <p class="text-xs font-bold text-emerald-700">{{ currentStep }} of {{ stepLabels.length }}</p>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-emerald-700 transition-all duration-300" :style="{ width: `${progressPct}%` }"></div>
              </div>
            </div>
          </div>
        </aside>

        <section class="min-w-0">
          <div class="mb-4 lg:hidden">
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-950">Launch your online store</h1>
            <p class="mt-1 text-sm font-medium text-slate-500">Complete the essentials and start selling.</p>
          </div>

          <div class="qs-card-soft mb-4 p-4 sm:p-5">
            <OnboardingProgress :current-step="currentStep" :steps="stepLabels" />
          </div>

          <div class="qs-card-soft overflow-hidden" :class="{ 'opacity-60 pointer-events-none': prefilling }">
            <div class="border-b border-slate-100 px-4 py-4 sm:px-6">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Step {{ currentStep }}</p>
                  <h2 class="mt-1 text-xl font-extrabold tracking-tight text-slate-950">{{ stepLabels[currentStep - 1] }}</h2>
                  <p class="mt-1 text-sm font-medium leading-6 text-slate-500">{{ stepDescriptions[currentStep - 1] }}</p>
                </div>
                <div class="hidden rounded-2xl bg-emerald-50 px-4 py-2 text-right sm:block">
                  <p class="text-xs font-bold text-emerald-700">Required</p>
                  <p class="text-sm font-extrabold text-slate-950">{{ currentStep === 2 ? products.length : currentStep }}/{{ currentStep === 2 ? '1 product' : stepLabels.length }}</p>
                </div>
              </div>
            </div>

            <div class="p-4 sm:p-6">
              <Transition name="slide" mode="out-in">
                <div :key="currentStep">
                  <StoreIdentityStep v-if="currentStep === 1" v-model="storeIdentity" />
                  <ProductCatalogStep v-else-if="currentStep === 2" :products="products" @update:products="(p: typeof products) => products = p" />
                  <DeliveryConfigStep v-else-if="currentStep === 3" v-model="deliveryConfig" @update:riderPhones="riderPhones = $event" />
                </div>
              </Transition>
            </div>

            <div class="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
              <button
                v-if="currentStep > 1"
                @click="prevStep"
                class="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 text-sm font-extrabold text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition hover:bg-slate-50"
              >
                <ArrowLeftIcon class="h-4 w-4" /> Back
              </button>
              <div v-else />

              <button
                @click="nextStep"
                :disabled="saving || !canProceed"
                class="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(20,132,71,0.22)] transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg v-if="saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ currentStep < 3 ? 'Save & Continue' : 'Finish Setup' }}
                <ArrowRightIcon v-if="!saving" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ArrowRightIcon, BuildingStorefrontIcon, CheckIcon, ClipboardDocumentIcon,
  CubeIcon, LinkIcon, SparklesIcon, TruckIcon
} from '@heroicons/vue/24/outline'
import OnboardingProgress from '@/components/dashboard/onboarding/OnboardingProgress.vue'
import StoreIdentityStep from '@/components/dashboard/onboarding/StoreIdentityStep.vue'
import ProductCatalogStep from '@/components/dashboard/onboarding/ProductCatalogStep.vue'
import DeliveryConfigStep from '@/components/dashboard/onboarding/DeliveryConfigStep.vue'
import { apiCompleteOnboarding, apiGetTenant, apiGetStoreSettings } from '@/api/settings'
import { apiGetProducts } from '@/api/products'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { ProductCreate, StoreCategory } from '@qesuite/types'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const currentStep = ref(1)
const prefilling = ref(true)
const isComplete = ref(false)
const saving = ref(false)
const storeSlug = ref('')

// Storefront base URL — derived from env, never hardcoded
const storefrontBase = computed(() =>
  (import.meta.env.VITE_STOREFRONT_URL || window.location.origin).replace(/\/$/, '')
)

const stepLabels = ['Store Identity', 'Product Catalog', 'Delivery Config']
const stepDescriptions = [
  'Brand your store with a logo, colors, and unique URL',
  'Add products your customers can order',
  'Set up how you deliver orders'
]

const journeyItems = [
  { label: 'Public storefront', value: 'Name, link, logo, banner', icon: BuildingStorefrontIcon },
  { label: 'Product catalog', value: 'Items customers can buy', icon: CubeIcon },
  { label: 'Delivery options', value: 'Pickup, delivery, riders', icon: TruckIcon },
]

const progressPct = computed(() => (currentStep.value / stepLabels.length) * 100)

const storeIdentity = ref({
  name: '',
  slug: '',
  store_category: 'other' as StoreCategory,
  logo_url: null as string | null,
  banner_url: null as string | null,
  primary_color: '#10b981',
  accent_color: '#0d9488',
  font_family: 'Inter',
  phone: '',
  address: ''
})

const products = ref<ProductCreate[]>([])

const deliveryConfig = ref({
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee: 150,
  delivery_radius_km: 10,
  estimated_delivery_minutes: 30,
  min_order_amount: 0,
  whatsapp_number: ''
})

const riderPhones = ref<string[]>([])

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!(storeIdentity.value.name && storeIdentity.value.slug)
  if (currentStep.value === 2) return products.value.length > 0
  return true
})

async function nextStep() {
  if (!canProceed.value) return
  if (currentStep.value < 3) {
    currentStep.value++
    return
  }
  // Final step — save everything in one call
  saving.value = true
  try {
    const res = await apiCompleteOnboarding({
      tenant: {
        name: storeIdentity.value.name,
        slug: storeIdentity.value.slug,
        store_category: storeIdentity.value.store_category,
        logo_url: storeIdentity.value.logo_url,
        banner_url: storeIdentity.value.banner_url,
        primary_color: storeIdentity.value.primary_color,
        accent_color: storeIdentity.value.accent_color,
        font_family: storeIdentity.value.font_family,
        phone: storeIdentity.value.phone || null,
        address: storeIdentity.value.address || null,
        whatsapp_number: deliveryConfig.value.whatsapp_number || null
      },
      settings: {
        delivery_enabled: deliveryConfig.value.delivery_enabled,
        pickup_enabled: deliveryConfig.value.pickup_enabled,
        delivery_fee: deliveryConfig.value.delivery_fee,
        delivery_radius_km: deliveryConfig.value.delivery_radius_km,
        estimated_delivery_minutes: deliveryConfig.value.estimated_delivery_minutes,
        min_order_amount: deliveryConfig.value.min_order_amount
      },
      products: products.value.map(p => ({
        name: p.name,
        price: p.price,
        description: p.description,
        stock: p.stock,
        image_url: p.image_url,
        sale_price: p.sale_price ?? undefined,
      })),
      rider_phones: riderPhones.value.length ? riderPhones.value : undefined
    })
    if (!res.success) throw new Error(res.error || 'Setup failed')

    storeSlug.value = storeIdentity.value.slug
    authStore.setOnboardingComplete(true)
    isComplete.value = true
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Setup failed', 'error')
  } finally {
    saving.value = false
  }
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function copyLink() {
  navigator.clipboard.writeText(`${storefrontBase.value}/${storeSlug.value}`)
  showToast('Link copied!', 'success')
}

function goToDashboard() {
  router.push('/orders')
}

onMounted(async () => {
  try {
    const [tenantRes, settingsRes, productsRes] = await Promise.all([
      apiGetTenant(),
      apiGetStoreSettings(),
      apiGetProducts()
    ])

    if (tenantRes.success && tenantRes.data) {
      const t = tenantRes.data
      if (t.name)          storeIdentity.value.name          = t.name
      if (t.slug)          storeIdentity.value.slug          = t.slug
      if (t.store_category) storeIdentity.value.store_category = t.store_category
      if (t.logo_url)      storeIdentity.value.logo_url      = t.logo_url
      if (t.banner_url)    storeIdentity.value.banner_url    = t.banner_url
      if (t.primary_color) storeIdentity.value.primary_color = t.primary_color
      if (t.accent_color)  storeIdentity.value.accent_color  = t.accent_color
      if (t.font_family)   storeIdentity.value.font_family   = t.font_family
      if (t.phone)         storeIdentity.value.phone         = t.phone
      if (t.address)       storeIdentity.value.address       = t.address
      if (t.whatsapp_number) deliveryConfig.value.whatsapp_number = t.whatsapp_number
    }

    if (settingsRes.success && settingsRes.data) {
      const s = settingsRes.data
      if (s.delivery_enabled !== undefined)           deliveryConfig.value.delivery_enabled           = Boolean(s.delivery_enabled)
      if (s.pickup_enabled !== undefined)             deliveryConfig.value.pickup_enabled             = Boolean(s.pickup_enabled)
      if (s.delivery_fee !== undefined)               deliveryConfig.value.delivery_fee               = s.delivery_fee
      if (s.delivery_radius_km !== undefined)         deliveryConfig.value.delivery_radius_km         = s.delivery_radius_km
      if (s.estimated_delivery_minutes !== undefined) deliveryConfig.value.estimated_delivery_minutes = s.estimated_delivery_minutes
      if (s.min_order_amount !== undefined)           deliveryConfig.value.min_order_amount           = s.min_order_amount
    }

    // Pre-load existing products (including seeded demo products) so user can review/edit
    // The actual API response shape is { data: { items: Product[], total, page, limit } }
    const productItems: ProductCreate[] = (productsRes as unknown as { data: { items: ProductCreate[] } })?.data?.items ?? []
    if (productItems.length > 0) {
      products.value = productItems.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description ?? undefined,
        stock: p.stock ?? undefined,
        image_url: (p as unknown as { image_url?: string }).image_url ?? undefined,
        sale_price: (p as unknown as { sale_price?: number | null }).sale_price ?? undefined,
      }))
    }
  } catch {
    // fall through — form keeps its default values
  } finally {
    prefilling.value = false
  }
})
</script>
