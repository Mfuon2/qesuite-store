<template>
  <div class="space-y-5 animate-fade-in">
    <div>
      <h2 class="text-xl font-bold text-slate-950 mb-1">
        {{ $t('checkout.delivery.title') }}
      </h2>
      <p class="text-sm text-slate-500">
        Step 2 of 4
      </p>
    </div>

    <!-- Delivery type selector -->
    <div class="space-y-1.5">
      <p class="text-sm font-semibold text-slate-700">
        {{ $t('checkout.delivery.type') }}
      </p>
      <div class="grid grid-cols-2 gap-3">
        <!-- Home Delivery -->
        <button
          v-if="deliveryEnabled"
          class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
          :class="form.deliveryType === 'delivery'
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-200 bg-white'"
          @click="form.deliveryType = 'delivery'"
        >
          <TruckIcon
            class="w-7 h-7"
            :class="form.deliveryType === 'delivery' ? 'text-emerald-600' : 'text-slate-400'"
          />
          <span
            class="text-sm font-semibold"
            :class="form.deliveryType === 'delivery' ? 'text-emerald-700' : 'text-slate-600'"
          >
            {{ $t('checkout.delivery.delivery') }}
          </span>
          <span class="text-xs" :class="form.deliveryType === 'delivery' ? 'text-emerald-600' : 'text-slate-400'">
            {{ deliveryFeeLabel }}
          </span>
        </button>

        <!-- Pickup -->
        <button
          v-if="pickupEnabled"
          class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
          :class="form.deliveryType === 'pickup'
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-200 bg-white'"
          @click="form.deliveryType = 'pickup'"
        >
          <BuildingStorefrontIcon
            class="w-7 h-7"
            :class="form.deliveryType === 'pickup' ? 'text-emerald-600' : 'text-slate-400'"
          />
          <span
            class="text-sm font-semibold"
            :class="form.deliveryType === 'pickup' ? 'text-emerald-700' : 'text-slate-600'"
          >
            {{ $t('checkout.delivery.pickup') }}
          </span>
          <span class="text-xs" :class="form.deliveryType === 'pickup' ? 'text-emerald-600' : 'text-slate-400'">
            {{ $t('common.free') }}
          </span>
        </button>
      </div>
    </div>

    <!-- Address (only for delivery) -->
    <div v-if="form.deliveryType === 'delivery'" class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <label class="block text-sm font-semibold text-slate-700">
          {{ $t('checkout.delivery.address') }} <span class="text-red-500">*</span>
        </label>
        <!-- Location status badge -->
        <div class="flex items-center gap-1.5">
          <span v-if="locationStatus === 'requesting'" class="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Locating…
          </span>
          <span v-else-if="locationStatus === 'granted'" class="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <MapPinIcon class="h-3 w-3" /> Location found
          </span>
          <button
            v-else-if="locationStatus === 'idle' || locationStatus === 'denied'"
            type="button"
            class="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 active:scale-95"
            @click="store.requestLocation()"
          >
            <MapPinIcon class="h-3 w-3" />
            {{ locationStatus === 'denied' ? 'Enable location' : 'Use my location' }}
          </button>
        </div>
      </div>

      <!-- Address search with Nominatim autocomplete -->
      <AddressSearch
        v-model="form.address"
        :placeholder="$t('checkout.delivery.address_placeholder')"
        :error="!!addressError"
        country-code="ke"
        @select="onAddressSelect"
      />
      <p v-if="addressError" class="text-xs text-red-500">{{ addressError }}</p>

      <!-- Location confirmation panel (shown when GPS acquired) -->
      <div
        v-if="locationStatus === 'granted'"
        class="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"
      >
        <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <MapPinIcon class="h-4 w-4 text-emerald-700" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-emerald-800">Using your current location</p>
          <p v-if="store.userAddress" class="mt-0.5 truncate text-xs text-emerald-700">{{ store.userAddress }}</p>
          <p v-else class="mt-0.5 text-xs text-emerald-600">
            {{ store.userLat?.toFixed(5) }}, {{ store.userLng?.toFixed(5) }}
          </p>
          <button
            type="button"
            class="mt-1 text-[11px] font-semibold text-emerald-700 underline underline-offset-2"
            @click="applyLocationToAddress"
          >
            Fill delivery address from location
          </button>
        </div>
      </div>

      <!-- Permission denied hint -->
      <div v-else-if="locationStatus === 'denied'" class="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
        <p class="flex items-start gap-1.5 text-xs text-amber-700">
          <MapPinIcon class="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Location access was denied. Enable it in your browser settings, or type your address manually.</span>
        </p>
      </div>

      <!-- ETA banner -->
      <div
        class="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl"
        :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }"
      >
        <ClockIcon class="w-4 h-4 flex-shrink-0" />
        <span>{{ $t('checkout.delivery.estimated_time', { minutes: estimatedMinutes }) }}</span>
      </div>
    </div>

    <!-- Notes -->
    <div class="space-y-1.5">
      <label class="block text-sm font-semibold text-slate-700">
        {{ $t('checkout.delivery.notes') }}
      </label>
      <textarea
        v-model="form.notes"
        :placeholder="$t('checkout.delivery.notes_placeholder')"
        rows="2"
        class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none bg-white text-slate-950 placeholder-slate-400 focus:border-emerald-500 transition-colors"
      />
    </div>

    <!-- Next -->
    <button
      class="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98]"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      @click="handleNext"
    >
      {{ $t('checkout.next') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { TruckIcon, BuildingStorefrontIcon, MapPinIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { useStorefrontStore } from '@/stores/store'
import { useCartStore } from '@/stores/cart'
import { useCart } from '@/composables/useCart'
import AddressSearch from '@/components/AddressSearch.vue'

const { t } = useI18n()
const checkout = useCheckoutStore()
const store = useStorefrontStore()
const cartStore = useCartStore()
const cart = useCart()
const form = checkout.form

watch(() => form.deliveryType, (type) => {
  cartStore.setDeliveryType(type)
}, { immediate: true })

const addressError = ref('')
const deliveryEnabled = computed(() => store.deliveryEnabled)
const pickupEnabled = computed(() => store.pickupEnabled)
const estimatedMinutes = computed(() => store.estimatedMinutes)
const deliveryFeeDisplay = computed(() => cart.formattedDeliveryFee.value)
const locationStatus = computed(() => store.locationStatus)

const deliveryFeeLabel = computed(() => {
  const fee = store.deliveryFee
  return fee === 0 ? t('common.free') : `+${deliveryFeeDisplay.value}`
})

// Pre-fill lat/lng from location whenever it becomes available
watch(() => store.locationStatus, (status) => {
  if (status === 'granted') {
    form.lat = store.userLat
    form.lng = store.userLng
  }
}, { immediate: true })

// Called when user selects a result from the Nominatim autocomplete
function onAddressSelect(payload: { address: string; lat: number; lng: number }) {
  form.address = payload.address
  if (payload.lat && payload.lng) {
    form.lat = payload.lat
    form.lng = payload.lng
  }
  addressError.value = ''
}

// Fill the address text field with the reverse-geocoded address
function applyLocationToAddress() {
  if (store.userAddress) {
    form.address = store.userAddress
  } else if (store.userLat !== null && store.userLng !== null) {
    form.address = `${store.userLat.toFixed(6)}, ${store.userLng.toFixed(6)}`
  }
  // Always set coordinates
  form.lat = store.userLat
  form.lng = store.userLng
}

// Auto-apply coordinates on mount if already granted
onMounted(() => {
  if (store.locationStatus === 'granted') {
    form.lat = store.userLat
    form.lng = store.userLng
  }
})

function handleNext() {
  if (form.deliveryType === 'delivery' && !form.address.trim()) {
    addressError.value = t('checkout.delivery.address_required')
    return
  }
  addressError.value = ''
  checkout.nextStep()
}
</script>
