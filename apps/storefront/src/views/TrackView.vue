<template>
  <div class="pb-24 pt-5 sm:pt-6">
    <div class="mx-auto max-w-[1480px] space-y-5 px-4 sm:px-5 lg:px-6">
      <!-- Loading -->
      <template v-if="loading">
        <section class="rounded-[30px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.045)] sm:p-6">
          <div class="flex items-center gap-3">
            <div class="skeleton h-14 w-14 rounded-[22px]" />
            <div class="min-w-0 flex-1 space-y-2">
              <div class="skeleton h-5 w-44 rounded" />
              <div class="skeleton h-3 w-64 max-w-full rounded" />
            </div>
            <div class="hidden sm:block skeleton h-10 w-28 rounded-2xl" />
          </div>
        </section>
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div class="rounded-[30px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.045)]">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-[24px]" />
            </div>
          </div>
          <div class="space-y-4">
            <div class="skeleton h-44 rounded-[30px]" />
            <div class="skeleton h-56 rounded-[30px]" />
          </div>
        </div>
      </template>

      <!-- Not found -->
      <section v-else-if="error" class="mx-auto max-w-xl rounded-[30px] border border-slate-100 bg-white px-6 py-14 text-center shadow-[0_14px_40px_rgba(15,23,42,0.045)]">
        <ExclamationCircleIcon class="mx-auto mb-4 h-14 w-14 text-slate-300" />
        <h1 class="text-xl font-black text-slate-950">{{ $t('tracking.not_found') }}</h1>
        <p class="mt-2 text-sm font-medium text-slate-500">{{ $t('tracking.not_found_hint') }}</p>
        <form class="track-lookup-form mx-auto mt-6 max-w-md" @submit.prevent="submitTrackLookup">
          <label class="sr-only" for="missing-tracking-code">Tracking code</label>
          <input
            id="missing-tracking-code"
            v-model="lookupCode"
            class="track-lookup-input"
            autocomplete="off"
            inputmode="text"
            placeholder="Enter tracking code"
          />
          <button class="track-lookup-submit" type="submit" :disabled="!lookupCode.trim() || refreshing">
            Track
          </button>
        </form>
        <p v-if="lookupError" class="track-lookup-error">{{ lookupError }}</p>
        <div class="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <RouterLink :to="`/${slug}`" class="track-secondary-action">
            <ArrowLeftIcon class="h-4 w-4" />
            Back to store
          </RouterLink>
          <button class="track-primary-action" @click="manualRefresh">
            <ArrowPathIcon :class="['h-4 w-4', refreshing ? 'animate-spin' : '']" />
            {{ $t('tracking.refresh') }}
          </button>
        </div>
      </section>

      <template v-else-if="trackData">
        <!-- Hero summary -->
        <section class="track-hero relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_16px_46px_rgba(15,23,42,0.05)]">
          <div
            class="absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-20 md:block"
            :style="heroImageStyle"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70" />

          <div class="relative p-5 sm:p-6">
            <div class="mb-5 flex flex-wrap items-center gap-2">
              <RouterLink :to="`/${slug}`" class="track-icon-button" title="Back to store">
                <ArrowLeftIcon class="h-5 w-5" />
              </RouterLink>
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {{ $t('tracking.auto_refresh') }}
              </div>
              <form class="track-lookup-form min-w-[260px] flex-1 sm:max-w-md lg:ml-auto" @submit.prevent="submitTrackLookup">
                <label class="sr-only" for="tracking-code">Tracking code</label>
                <input
                  id="tracking-code"
                  v-model="lookupCode"
                  class="track-lookup-input"
                  autocomplete="off"
                  inputmode="text"
                  placeholder="Track another order"
                />
                <button class="track-lookup-submit" type="submit" :disabled="!lookupCode.trim() || refreshing">
                  Track
                </button>
              </form>
              <button class="track-secondary-action ml-auto min-h-9 px-3 py-2" @click="manualRefresh">
                <ArrowPathIcon :class="['h-4 w-4', refreshing ? 'animate-spin' : '']" />
                {{ $t('tracking.refresh') }}
              </button>
            </div>

            <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div class="flex min-w-0 items-start gap-4">
                <div
                  class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[24px] ring-1 sm:h-20 sm:w-20"
                  :class="storeLogo ? 'bg-emerald-50 ring-emerald-100' : 'ring-transparent'"
                  :style="!storeLogo ? { backgroundColor: 'var(--color-primary)' } : undefined"
                >
                  <img v-if="storeLogo" :src="storeLogo" :alt="storeName" class="h-full w-full object-cover" />
                  <span v-else class="text-2xl font-black text-white">{{ storeInitial }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{{ $t('tracking.title') }}</p>
                  <h1 class="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                    {{ currentStatusTitle }}
                  </h1>
                  <p class="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                    {{ currentStatusDescription }}
                  </p>
                </div>
              </div>

              <div class="rounded-[26px] border border-slate-100 bg-white/92 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] backdrop-blur">
                <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Tracking code</p>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <p class="font-mono text-2xl font-black tracking-[0.18em] text-slate-950">
                    {{ trackData.order.tracking_code }}
                  </p>
                  <span :class="['track-status-pill', statusBadgeClass]">
                    {{ $t(`tracking.statuses.${trackData.order.status}`) }}
                  </span>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                  <div class="rounded-2xl bg-slate-50 p-3">
                    <p class="text-slate-400">Placed</p>
                    <p class="mt-1 text-slate-800">{{ formatDateTime(trackData.order.created_at) }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-3">
                    <p class="text-slate-400">Payment</p>
                    <p :class="['mt-1 capitalize', paymentTextClass]">{{ trackData.order.payment_status }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div class="space-y-5">
            <!-- Status progress -->
            <section class="track-panel">
              <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 class="track-section-title">Order Progress</h2>
                  <p class="track-section-copy">Follow each stage from confirmation to arrival.</p>
                </div>
                <span v-if="trackData.order.status === 'OUT_FOR_DELIVERY'" class="track-soft-pill">
                  <TruckIcon class="h-4 w-4" />
                  {{ $t('tracking.eta') }} ~{{ estimatedMinutes }} min
                </span>
              </div>

              <div v-if="isCancelled" class="rounded-[24px] border border-red-100 bg-red-50 p-5">
                <div class="flex items-start gap-3">
                  <ExclamationCircleIcon class="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                  <div>
                    <p class="font-black text-red-900">{{ $t('tracking.statuses.CANCELLED') }}</p>
                    <p class="mt-1 text-sm font-medium text-red-700">{{ $t('tracking.status_desc.CANCELLED') }}</p>
                  </div>
                </div>
              </div>

              <div v-else class="track-timeline-grid">
                <div
                  v-for="(step, i) in statusSteps"
                  :key="step.status"
                  :class="[
                    'track-timeline-card',
                    isCurrent(step.status) ? 'track-step-current' : '',
                    isCompleted(step.status) ? 'track-step-complete' : ''
                  ]"
                >
                  <div class="flex items-start gap-2.5">
                    <div
                      :class="[
                        'track-step-dot',
                        isCurrent(step.status) || isCompleted(step.status)
                          ? 'track-step-dot-active'
                          : 'track-step-dot-muted'
                      ]"
                    >
                      <span class="text-xs font-black">{{ i + 1 }}</span>
                    </div>
                    <div class="min-w-0">
                      <p :class="['track-timeline-title', isCurrent(step.status) || isCompleted(step.status) ? 'text-slate-950' : 'text-slate-500']">
                        {{ $t(`tracking.statuses.${step.status}`) }}
                      </p>
                      <p class="track-timeline-copy">
                        {{ $t(`tracking.status_desc.${step.status}`) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Rider + map -->
            <section v-if="trackData.assignment && trackData.order.status === 'OUT_FOR_DELIVERY'" class="track-panel">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 class="track-section-title">{{ $t('tracking.rider_info') }}</h2>
                  <p class="track-section-copy">Your order is actively being delivered.</p>
                </div>
                <a
                  v-if="trackData.assignment.rider_phone"
                  :href="`tel:${trackData.assignment.rider_phone}`"
                  class="track-primary-action min-h-10 px-3 py-2"
                >
                  <PhoneIcon class="h-4 w-4" />
                  Call
                </a>
              </div>

              <div class="mb-4 flex items-center gap-3 rounded-[24px] border border-slate-100 bg-slate-50/70 p-3">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <UserCircleIcon class="h-8 w-8 text-slate-400" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-black text-slate-950">{{ trackData.assignment.rider_name || 'Your Rider' }}</p>
                  <p class="truncate text-sm font-medium text-slate-500">{{ trackData.assignment.rider_phone || 'Phone pending' }}</p>
                </div>
              </div>

              <LiveMap
                :rider-lat="trackData.rider_location?.lat ?? null"
                :rider-lng="trackData.rider_location?.lng ?? null"
                :dest-lat="trackData.order.delivery_lat ?? null"
                :dest-lng="trackData.order.delivery_lng ?? null"
                height="260px"
              />
            </section>
          </div>

          <aside class="space-y-4">
            <!-- Delivery summary -->
            <section class="track-panel">
              <h2 class="track-section-title">Delivery Details</h2>
              <div class="mt-4 space-y-3">
                <div class="track-info-row">
                  <MapPinIcon class="h-5 w-5 text-[var(--color-primary)]" />
                  <div class="min-w-0">
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Deliver to</p>
                    <p class="mt-0.5 text-sm font-bold leading-5 text-slate-800">{{ deliveryAddress }}</p>
                  </div>
                </div>
                <div class="track-info-row">
                  <ClockIcon class="h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Last update</p>
                    <p class="mt-0.5 text-sm font-bold text-slate-800">{{ formatDateTime(trackData.order.updated_at) }}</p>
                  </div>
                </div>
                <div class="track-info-row">
                  <CreditCardIcon class="h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Payment status</p>
                    <p :class="['mt-0.5 text-sm font-black capitalize', paymentTextClass]">{{ trackData.order.payment_status }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Order items -->
            <section class="track-panel">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 class="track-section-title">{{ $t('tracking.order_items') }}</h2>
                  <p class="track-section-copy">{{ trackData.items.length }} items</p>
                </div>
                <ShoppingBagIcon class="h-6 w-6 text-slate-300" />
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in trackData.items"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5"
                >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-800">{{ item.product_name }}</p>
                    <p class="text-xs font-medium text-slate-500">Qty {{ item.quantity }}</p>
                  </div>
                  <p class="shrink-0 text-sm font-black text-slate-950">
                    {{ formatPrice(item.line_total ?? item.price * item.quantity) }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span class="text-sm font-black text-slate-950">{{ $t('tracking.order_total') }}</span>
                <span class="text-lg font-black text-[var(--color-primary)]">{{ formatPrice(trackData.order.total) }}</span>
              </div>
            </section>

            <!-- Support -->
            <a
              v-if="whatsappUrl"
              :href="whatsappUrl"
              target="_blank"
              class="track-support-card"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>{{ $t('tracking.whatsapp_support') }}</span>
            </a>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import { trackOrder } from '@/api/storefront'
import LiveMap from '@/components/LiveMap.vue'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'
import type { TrackOrderResponse, OrderStatus } from '@qesuite/types'

const route = useRoute()
const router = useRouter()
const store = useStorefrontStore()
const cart = useCart()

const slug = computed(() => route.params.slug as string)
const code = computed(() => route.params.code as string)
const trackData = ref<TrackOrderResponse | null>(null)
const loading = ref(true)
const refreshing = ref(false)
const error = ref(false)
const lookupCode = ref(code.value)
const lookupError = ref('')
let pollInterval: ReturnType<typeof setInterval> | null = null

const estimatedMinutes = computed(() => store.estimatedMinutes)
const whatsappNumber = computed(() => store.whatsappNumber)
const storeName = computed(() => store.config?.tenant.name || 'Store')
const storeLogo = computed(() => store.config?.tenant.logo_url || null)
const storeInitial = computed(() => storeName.value.charAt(0).toUpperCase())
const deliveryAddress = computed(() =>
  trackData.value?.order.delivery_address || store.config?.tenant.address || 'Delivery address pending'
)
const heroImageStyle = computed(() => {
  const banner = store.config?.tenant.banner_url || '/qesuite-marketplace-strip.png'
  return { backgroundImage: `url('${banner}')` }
})

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

const isCancelled = computed(() => trackData.value?.order.status === 'CANCELLED')

const currentStatusTitle = computed(() => {
  if (!trackData.value) return 'Tracking your order'
  return statusTitle(trackData.value.order.status)
})

const currentStatusDescription = computed(() => {
  if (!trackData.value) return ''
  return statusDescription(trackData.value.order.status)
})

const paymentTextClass = computed(() => {
  const status = trackData.value?.order.payment_status
  if (status === 'paid') return 'text-emerald-700'
  if (status === 'failed') return 'text-red-700'
  return 'text-amber-700'
})

function statusTitle(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    NEW: 'Order received',
    CONFIRMED: 'Your order is confirmed',
    PREPARING: 'Your order is being prepared',
    READY: 'Your order is ready',
    OUT_FOR_DELIVERY: 'Your order is on the way',
    DELIVERED: 'Your order has arrived',
    CANCELLED: 'This order was cancelled',
  }
  return labels[status]
}

function statusDescription(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    NEW: 'The store has received your order and will confirm it shortly.',
    CONFIRMED: 'The store has accepted your order and is getting things moving.',
    PREPARING: 'Your items are being packed and prepared with care.',
    READY: 'Your order is ready for pickup or waiting for rider collection.',
    OUT_FOR_DELIVERY: `A rider is heading to you. Estimated arrival is about ${estimatedMinutes.value} minutes.`,
    DELIVERED: 'Thanks for shopping. We hope everything arrived perfectly.',
    CANCELLED: 'Please contact the store if you need more information about this order.',
  }
  return labels[status]
}

function isCompleted(status: OrderStatus) {
  if (!trackData.value) return false
  if (trackData.value.order.status === 'CANCELLED') return false
  return ORDER_STATUS_INDEX[status] < currentStatusIndex.value
}

function isCurrent(status: OrderStatus) {
  if (!trackData.value) return false
  return trackData.value.order.status === status
}

const statusBadgeClass = computed(() => {
  if (!trackData.value) return ''
  const s = trackData.value.order.status
  if (s === 'DELIVERED') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (s === 'CANCELLED') return 'bg-red-50 text-red-700 ring-red-100'
  if (s === 'OUT_FOR_DELIVERY') return 'bg-blue-50 text-blue-700 ring-blue-100'
  return 'bg-amber-50 text-amber-700 ring-amber-100'
})

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchTrackData() {
  try {
    trackData.value = await trackOrder(slug.value, code.value)
    error.value = false
  } catch {
    error.value = true
  }
}

async function manualRefresh() {
  refreshing.value = true
  try {
    await fetchTrackData()
  } finally {
    refreshing.value = false
  }
}

async function submitTrackLookup() {
  const nextCode = lookupCode.value.trim().replace(/\s+/g, '').toUpperCase()
  if (!nextCode) {
    lookupError.value = 'Enter a tracking code'
    return
  }

  lookupError.value = ''
  lookupCode.value = nextCode

  if (nextCode === code.value) {
    await manualRefresh()
    return
  }

  await router.push(`/${slug.value}/track/${encodeURIComponent(nextCode)}`)
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

watch(code, async (nextCode) => {
  lookupCode.value = nextCode
  loading.value = true
  await fetchTrackData()
  loading.value = false
})
</script>

<style scoped>
.track-panel {
  border: 1px solid rgba(226, 232, 240, 0.86);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.045);
  padding: 1rem;
  backdrop-filter: blur(12px);
}

.track-section-title {
  font-size: 1rem;
  font-weight: 900;
  color: #020617;
  letter-spacing: 0;
}

.track-section-copy {
  margin-top: 0.15rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: #64748b;
}

.track-primary-action,
.track-secondary-action {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 1rem;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 800;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease;
}

.track-primary-action {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.track-secondary-action {
  border: 1px solid #e2e8f0;
  background: white;
  color: #334155;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.035);
}

.track-primary-action:active,
.track-secondary-action:active,
.track-icon-button:active {
  transform: scale(0.97);
}

.track-secondary-action:hover {
  border-color: color-mix(in srgb, var(--color-primary) 24%, transparent);
  background: color-mix(in srgb, var(--color-primary) 7%, white);
  color: var(--color-primary);
}

.track-icon-button {
  display: grid;
  height: 2.5rem;
  width: 2.5rem;
  place-items: center;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.035);
  transition: transform 150ms ease, background 150ms ease, color 150ms ease;
}

.track-lookup-form {
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.35rem;
  border-radius: 1.15rem;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
  padding: 0.3rem;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.035);
}

.track-lookup-input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0 0.7rem;
  font-size: 0.86rem;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  outline: none;
}

.track-lookup-input::placeholder {
  color: #94a3b8;
  font-weight: 700;
  text-transform: none;
}

.track-lookup-submit {
  min-height: 2rem;
  flex-shrink: 0;
  border-radius: 0.85rem;
  background: var(--color-primary);
  padding: 0 0.9rem;
  font-size: 0.78rem;
  font-weight: 900;
  color: white;
  transition: opacity 150ms ease, transform 150ms ease;
}

.track-lookup-submit:active {
  transform: scale(0.97);
}

.track-lookup-submit:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.track-lookup-error {
  margin-top: 0.55rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: #dc2626;
}

.track-status-pill,
.track-soft-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px currentColor;
  box-shadow: none;
}

.track-status-pill {
  border: 1px solid;
}

.track-soft-pill {
  background: color-mix(in srgb, var(--color-primary) 8%, white);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.track-timeline-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.track-timeline-card {
  border: 1px solid #eef2f7;
  border-radius: 20px;
  background: rgba(251, 253, 255, 0.88);
  min-height: 5.1rem;
  padding: 0.78rem;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease, background 150ms ease;
}

.track-step-current,
.track-step-complete {
  border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
  background: color-mix(in srgb, var(--color-primary) 5%, white);
}

.track-step-current {
  box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.track-step-dot {
  display: grid;
  height: 2.1rem;
  width: 2.1rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 0.85rem;
}

.track-step-dot-active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 12px 24px color-mix(in srgb, var(--color-primary) 16%, transparent);
}

.track-step-dot-muted {
  background: #f1f5f9;
  color: #94a3b8;
}

.track-timeline-title {
  font-size: 0.86rem;
  font-weight: 900;
  line-height: 1.2;
}

.track-timeline-copy {
  margin-top: 0.25rem;
  font-size: 0.73rem;
  font-weight: 600;
  line-height: 1.4;
  color: #64748b;
}

.track-info-row {
  display: flex;
  gap: 0.75rem;
  border-radius: 1.25rem;
  background: #f8fafc;
  padding: 0.9rem;
}

.track-support-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border-radius: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--color-primary) 24%, transparent);
  background: color-mix(in srgb, var(--color-primary) 6%, white);
  padding: 1rem;
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--color-primary);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--color-primary) 8%, transparent);
}

@media (max-width: 640px) {
  .track-panel {
    border-radius: 24px;
    padding: 1rem;
  }

  .track-timeline-card {
    padding: 0.85rem;
  }

  .track-step-dot {
    height: 2.15rem;
    width: 2.15rem;
    border-radius: 0.85rem;
  }
}

@media (min-width: 640px) {
  .track-timeline-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .track-timeline-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .track-panel {
    padding: 1.05rem;
  }
}
</style>
