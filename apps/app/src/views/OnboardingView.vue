<template>
  <div class="min-h-screen bg-white text-slate-950">
    <!-- Success state -->
    <Transition name="fade">
      <div v-if="isComplete" class="relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-center">
        <div class="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(20,132,71,0.16),transparent_36rem)]"></div>
        <div class="qs-card-soft relative w-full max-w-lg p-4">
          <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 shadow-[0_18px_42px_rgba(20,132,71,0.25)]">
            <CheckIcon class="h-6 w-6 text-white" />
          </div>
          <h1 class="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Your store is live</h1>
          <p class="mx-auto mt-1 max-w-md text-xs font-medium leading-5 text-slate-500">
            Your setup is complete. Share the storefront link with customers and start taking orders.
          </p>
          <div class="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-left">
            <LinkIcon class="h-4 w-4 shrink-0 text-emerald-700" />
            <span class="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-slate-700">{{ storefrontBase }}/{{ storeSlug }}</span>
            <button @click="copyLink" class="grid h-8 w-8 place-items-center rounded-lg bg-white text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <ClipboardDocumentIcon class="h-4 w-4" />
            </button>
          </div>
          <button
            @click="goToDashboard"
            class="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-extrabold text-white shadow-[0_16px_34px_rgba(20,132,71,0.22)] transition hover:bg-emerald-800"
          >
            Go to Dashboard <ArrowRightIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Wizard -->
    <div v-if="!isComplete" class="onboarding-dense relative min-h-screen overflow-hidden">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_24%_0%,rgba(20,132,71,0.16),transparent_34rem)]"></div>

      <header class="relative mx-auto flex max-w-[1280px] items-center justify-between px-3 py-2.5 sm:px-5 lg:px-6">
        <div class="flex items-center gap-2.5">
          <span class="qs-brand-mark shrink-0"></span>
          <p class="qs-brand-word text-lg leading-tight"><span>Store</span></p>
        </div>
        <div class="hidden items-center gap-1.5 text-xs font-bold text-slate-500 sm:flex">
          <SparklesIcon class="h-4 w-4 text-emerald-700" />
          {{ Math.round(progressPct) }}% complete
        </div>
      </header>

      <main class="relative mx-auto max-w-[1280px] px-3 pb-4 sm:px-5 lg:px-6">
        <section class="min-w-0">
          <div class="qs-card-soft overflow-hidden" :class="{ 'opacity-60 pointer-events-none': prefilling }">
            <div class="border-b border-slate-100 px-3 py-3 sm:px-4">
              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)] lg:items-center">
                <div>
                  <p class="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Step {{ currentStep }} of {{ stepLabels.length }}</p>
                  <h2 class="mt-0.5 text-lg font-extrabold tracking-tight text-slate-950">{{ stepLabels[currentStep - 1] }}</h2>
                  <p class="mt-0.5 text-xs font-medium text-slate-500">{{ stepDescriptions[currentStep - 1] }}</p>
                </div>
                <OnboardingProgress :current-step="currentStep" :steps="stepLabels" />
              </div>
            </div>

            <div class="p-3 sm:p-4">
              <Transition name="slide" mode="out-in">
                <div :key="currentStep">
                  <StoreIdentityStep v-if="currentStep === 1" v-model="storeIdentity" />
                  <ProductCatalogStep v-else-if="currentStep === 2" :products="products" @update:products="(p: typeof products) => products = p" />
                  <DeliveryConfigStep v-else-if="currentStep === 3" v-model="deliveryConfig" @update:riderPhones="riderPhones = $event" />
                </div>
              </Transition>
            </div>

            <div class="sticky bottom-0 flex items-center justify-between gap-2 border-t border-slate-100 bg-white/95 px-3 py-2 backdrop-blur sm:px-4">
              <button
                v-if="currentStep > 1"
                @click="prevStep"
                class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 text-xs font-extrabold text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition hover:bg-slate-50"
              >
                <ArrowLeftIcon class="h-4 w-4" /> Back
              </button>
              <div v-else />

              <button
                @click="nextStep"
                :disabled="saving || !canProceed"
                class="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-extrabold text-white shadow-[0_14px_30px_rgba(20,132,71,0.22)] transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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
  ArrowLeftIcon, ArrowRightIcon, CheckIcon, ClipboardDocumentIcon,
  LinkIcon, SparklesIcon
} from '@heroicons/vue/24/outline'
import OnboardingProgress from '@/components/dashboard/onboarding/OnboardingProgress.vue'
import StoreIdentityStep from '@/components/dashboard/onboarding/StoreIdentityStep.vue'
import ProductCatalogStep from '@/components/dashboard/onboarding/ProductCatalogStep.vue'
import DeliveryConfigStep from '@/components/dashboard/onboarding/DeliveryConfigStep.vue'
import { apiCompleteOnboarding, apiGetTenant, apiGetStoreSettings } from '@/api/settings'
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
  address: '',
  lat: null as number | null,
  lng: null as number | null,
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
        lat: storeIdentity.value.lat ?? null,
        lng: storeIdentity.value.lng ?? null,
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
    const [tenantRes, settingsRes] = await Promise.all([
      apiGetTenant(),
      apiGetStoreSettings()
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
      if ((t as { lat?: number | null }).lat != null)  storeIdentity.value.lat = (t as { lat?: number | null }).lat!
      if ((t as { lng?: number | null }).lng != null)  storeIdentity.value.lng = (t as { lng?: number | null }).lng!
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

  } catch {
    // fall through — form keeps its default values
  } finally {
    prefilling.value = false
  }
})
</script>
