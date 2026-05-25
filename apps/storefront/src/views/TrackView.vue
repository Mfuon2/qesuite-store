<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
      <div class="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
        <RouterLink :to="`/${slug}`" class="p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <span class="font-bold text-gray-900 dark:text-white text-base">
          {{ $t('tracking.title') }}
        </span>
        <div class="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
          <span class="animate-pulse">●</span>
          <span>{{ $t('tracking.auto_refresh') }}</span>
        </div>
      </div>
    </div>

    <div class="max-w-xl mx-auto px-4 py-6 pb-24 space-y-5">
      <!-- Loading -->
      <template v-if="loading">
        <div class="space-y-4">
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-3 border border-gray-100 dark:border-gray-800">
            <div class="skeleton h-6 w-40 rounded" />
            <div class="skeleton h-4 w-24 rounded" />
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div class="space-y-4">
              <div v-for="i in 7" :key="i" class="flex gap-3">
                <div class="skeleton w-8 h-8 rounded-full" />
                <div class="flex-1 space-y-1.5 pt-1">
                  <div class="skeleton h-4 w-28 rounded" />
                  <div class="skeleton h-3 w-40 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Not found -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <ExclamationCircleIcon class="w-14 h-14 text-gray-300 mb-4" />
        <h2 class="font-bold text-gray-700 dark:text-gray-300 text-lg mb-1">
          {{ $t('tracking.not_found') }}
        </h2>
        <p class="text-sm text-gray-400 dark:text-gray-600">{{ $t('tracking.not_found_hint') }}</p>
      </div>

      <template v-else-if="trackData">
        <!-- Status badge + tracking code -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
                {{ $t('tracking.title') }}
              </p>
              <p class="font-mono font-bold text-lg text-gray-900 dark:text-white tracking-widest">
                {{ trackData.order.tracking_code }}
              </p>
            </div>
            <span
              class="text-xs font-bold px-3 py-1.5 rounded-full"
              :class="statusBadgeClass"
            >
              {{ $t(`tracking.statuses.${trackData.order.status}`) }}
            </span>
          </div>

          <!-- ETA if out for delivery -->
          <div
            v-if="trackData.order.status === 'OUT_FOR_DELIVERY'"
            class="mt-4 flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl"
            :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }"
          >
            <TruckIcon class="w-4 h-4" />
            <span>{{ $t('tracking.eta') }}: ~{{ estimatedMinutes }} min</span>
          </div>
        </div>

        <!-- Status stepper -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h3 class="font-bold text-gray-900 dark:text-white mb-5">Order Progress</h3>
          <div class="space-y-0">
            <div
              v-for="(step, i) in statusSteps"
              :key="step.status"
              class="flex gap-4"
            >
              <!-- Connector + circle -->
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 z-10"
                  :class="getStepCircleClass(step.status)"
                >
                  <CheckIcon v-if="isCompleted(step.status)" class="w-4 h-4 text-white" />
                  <span
                    v-else-if="isCurrent(step.status)"
                    class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"
                  />
                  <span v-else class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <div
                  v-if="i < statusSteps.length - 1"
                  class="w-0.5 flex-1 min-h-[28px] my-1 transition-colors duration-300"
                  :class="isCompleted(step.status) ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'"
                />
              </div>

              <!-- Label -->
              <div class="pb-6">
                <p
                  class="text-sm font-semibold transition-colors"
                  :class="isCurrent(step.status) || isCompleted(step.status)
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-600'"
                >
                  {{ $t(`tracking.statuses.${step.status}`) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ $t(`tracking.status_desc.${step.status}`) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Rider info (when out for delivery) -->
        <div
          v-if="trackData.assignment && trackData.order.status === 'OUT_FOR_DELIVERY'"
          class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
        >
          <h3 class="font-bold text-gray-900 dark:text-white mb-4">{{ $t('tracking.rider_info') }}</h3>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UserCircleIcon class="w-8 h-8 text-gray-400" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ trackData.assignment.rider_name || 'Your Rider' }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ trackData.assignment.rider_phone || '' }}
              </p>
            </div>
            <a
              v-if="trackData.assignment.rider_phone"
              :href="`tel:${trackData.assignment.rider_phone}`"
              class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
              :style="{ backgroundColor: 'var(--color-primary)' }"
            >
              <PhoneIcon class="w-5 h-5" />
            </a>
          </div>

          <!-- Map placeholder -->
          <div class="mt-4 w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
            <div class="text-center">
              <MapPinIcon class="w-7 h-7 text-gray-400 mx-auto mb-1" />
              <p class="text-xs text-gray-400">Live map coming soon</p>
            </div>
          </div>
        </div>

        <!-- Order items -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h3 class="font-bold text-gray-900 dark:text-white mb-4">{{ $t('tracking.order_items') }}</h3>
          <div class="space-y-2">
            <div
              v-for="item in trackData.items"
              :key="item.id"
              class="flex justify-between items-center text-sm"
            >
              <span class="text-gray-700 dark:text-gray-300">
                {{ item.product_name }} × {{ item.quantity }}
              </span>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ formatPrice(item.line_total ?? item.price * item.quantity) }}
              </span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between font-bold">
            <span class="text-gray-900 dark:text-white">{{ $t('tracking.order_total') }}</span>
            <span :style="{ color: 'var(--color-primary)' }">{{ formatPrice(trackData.order.total) }}</span>
          </div>
        </div>

        <!-- WhatsApp support -->
        <a
          v-if="whatsappUrl"
          :href="whatsappUrl"
          target="_blank"
          class="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold text-sm transition-all active:scale-[0.98] hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {{ $t('tracking.whatsapp_support') }}
        </a>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  ArrowLeftIcon,
  CheckIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import { trackOrder } from '@/api/storefront'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'
import type { TrackOrderResponse, OrderStatus } from '@qesuite/types'

const route = useRoute()
const store = useStorefrontStore()
const cart = useCart()

const slug = computed(() => route.params.slug as string)
const code = computed(() => route.params.code as string)
const trackData = ref<TrackOrderResponse | null>(null)
const loading = ref(true)
const error = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

const estimatedMinutes = computed(() => store.estimatedMinutes)
const whatsappNumber = computed(() => store.whatsappNumber)
const whatsappUrl = computed(() => {
  if (!whatsappNumber.value) return null
  const num = whatsappNumber.value.replace(/[^0-9]/g, '')
  const message = encodeURIComponent(`Hi! I need help with order ${trackData.value?.order.tracking_code || code.value}`)
  return `https://wa.me/${num}?text=${message}`
})

const statusSteps: { status: OrderStatus }[] = [
  { status: 'NEW' },
  { status: 'CONFIRMED' },
  { status: 'PREPARING' },
  { status: 'READY' },
  { status: 'OUT_FOR_DELIVERY' },
  { status: 'DELIVERED' },
]

const ORDER_STATUS_INDEX: Record<OrderStatus, number> = {
  NEW: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
}

const currentStatusIndex = computed(() => {
  if (!trackData.value) return -1
  return ORDER_STATUS_INDEX[trackData.value.order.status] ?? -1
})

function isCompleted(status: OrderStatus) {
  if (!trackData.value) return false
  if (trackData.value.order.status === 'CANCELLED') return false
  return ORDER_STATUS_INDEX[status] < currentStatusIndex.value
}

function isCurrent(status: OrderStatus) {
  if (!trackData.value) return false
  return trackData.value.order.status === status
}

function getStepCircleClass(status: OrderStatus) {
  if (isCurrent(status)) {
    return 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
  }
  if (isCompleted(status)) {
    return 'bg-emerald-500'
  }
  return 'bg-gray-100 dark:bg-gray-800'
}

const statusBadgeClass = computed(() => {
  if (!trackData.value) return ''
  const s = trackData.value.order.status
  if (s === 'DELIVERED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (s === 'CANCELLED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (s === 'OUT_FOR_DELIVERY') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
})

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}

async function fetchTrackData() {
  try {
    trackData.value = await trackOrder(slug.value, code.value)
    error.value = false
  } catch {
    error.value = true
  }
}

onMounted(async () => {
  loading.value = true
  await fetchTrackData()
  loading.value = false

  // Auto-refresh every 30 seconds if not delivered/cancelled
  pollInterval = setInterval(async () => {
    const status = trackData.value?.order.status
    if (status !== 'DELIVERED' && status !== 'CANCELLED') {
      await fetchTrackData()
    }
  }, 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
div[class*="ring-2"] {
  background-color: var(--color-primary);
  ring-color: var(--color-primary);
}
</style>
