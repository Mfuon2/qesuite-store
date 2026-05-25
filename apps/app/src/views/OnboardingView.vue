<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
    <!-- Success state -->
    <Transition name="fade">
      <div v-if="isComplete" class="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div class="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/30 animate-bounce-in">
          <CheckIcon class="w-12 h-12 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">Your store is live!</h1>
        <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Congratulations! Your store is set up and ready to receive orders. Share your store link with customers.
        </p>
        <div class="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 mb-8 shadow-sm">
          <LinkIcon class="w-5 h-5 text-primary shrink-0" />
          <span class="font-mono text-sm text-gray-700 dark:text-gray-300">qesuite.store/{{ storeSlug }}</span>
          <button @click="copyLink" class="text-primary hover:text-accent transition-colors">
            <ClipboardDocumentIcon class="w-5 h-5" />
          </button>
        </div>
        <button
          @click="goToDashboard"
          class="px-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:opacity-90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
        >
          Go to Dashboard <ArrowRightIcon class="w-5 h-5" />
        </button>
      </div>
    </Transition>

    <!-- Wizard -->
    <div v-if="!isComplete" class="max-w-5xl mx-auto p-4 sm:p-6">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 class="font-bold text-gray-900 dark:text-white text-base leading-tight">Set up your store</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Just 3 quick steps</p>
        </div>
      </div>

      <!-- Progress -->
      <div class="mb-4">
        <OnboardingProgress :current-step="currentStep" :steps="stepLabels" />
      </div>

      <!-- Step card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="border-b border-gray-100 dark:border-gray-700 px-5 py-3">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ stepLabels[currentStep - 1] }}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ stepDescriptions[currentStep - 1] }}</p>
        </div>

        <div class="p-5">
          <Transition name="slide" mode="out-in">
            <div :key="currentStep">
              <StoreIdentityStep v-if="currentStep === 1" v-model="storeIdentity" />
              <ProductCatalogStep v-else-if="currentStep === 2" :products="products" @update:products="(p: typeof products) => products = p" />
              <DeliveryConfigStep v-else-if="currentStep === 3" v-model="deliveryConfig" @update:riderPhones="riderPhones = $event" />
            </div>
          </Transition>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700 px-5 py-3 flex items-center justify-between">
          <button
            v-if="currentStep > 1"
            @click="prevStep"
            class="flex items-center gap-2 px-5 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeftIcon class="w-4 h-4" /> Back
          </button>
          <div v-else />

          <button
            @click="nextStep"
            :disabled="saving || !canProceed"
            class="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-primary/20"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ currentStep < 3 ? 'Save & Continue' : 'Finish Setup' }}
            <ArrowRightIcon v-if="!saving" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckIcon, LinkIcon, ClipboardDocumentIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import OnboardingProgress from '@/components/dashboard/onboarding/OnboardingProgress.vue'
import StoreIdentityStep from '@/components/dashboard/onboarding/StoreIdentityStep.vue'
import ProductCatalogStep from '@/components/dashboard/onboarding/ProductCatalogStep.vue'
import DeliveryConfigStep from '@/components/dashboard/onboarding/DeliveryConfigStep.vue'
import { apiCompleteOnboarding } from '@/api/settings'
import { apiBulkImportProducts } from '@/api/products'
import { apiCreateDeliveryStaff, apiSendMagicLink } from '@/api/delivery'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { ProductCreate } from '@qesuite/types'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const currentStep = ref(1)
const isComplete = ref(false)
const saving = ref(false)
const storeSlug = ref('')

const stepLabels = ['Store Identity', 'Product Catalog', 'Delivery Config']
const stepDescriptions = [
  'Brand your store with a logo, colors, and unique URL',
  'Add products your customers can order',
  'Set up how you deliver orders'
]

const storeIdentity = ref({
  name: '',
  slug: '',
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
  // Final step — save everything
  saving.value = true
  try {
    // Save tenant + settings
    const res = await apiCompleteOnboarding({
      tenant: {
        name: storeIdentity.value.name,
        slug: storeIdentity.value.slug,
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
      }
    })
    if (!res.success) throw new Error(res.error || 'Setup failed')

    storeSlug.value = storeIdentity.value.slug

    // Import products
    if (products.value.length) {
      await apiBulkImportProducts(products.value).catch(() => {})
    }

    // Invite riders
    for (const phone of riderPhones.value) {
      try {
        const rider = await apiCreateDeliveryStaff({ name: phone, phone })
        if (rider.success && rider.data) await apiSendMagicLink(rider.data.id).catch(() => {})
      } catch { /* continue */ }
    }

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
  navigator.clipboard.writeText(`https://qesuite.store/${storeSlug.value}`)
  showToast('Link copied!', 'success')
}

function goToDashboard() {
  router.push('/orders')
}
</script>
