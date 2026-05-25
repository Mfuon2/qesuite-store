<template>
  <div class="space-y-5 animate-fade-in">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {{ $t('checkout.delivery.title') }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Step 2 of 4
      </p>
    </div>

    <!-- Delivery type selector -->
    <div class="space-y-1.5">
      <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {{ $t('checkout.delivery.type') }}
      </p>
      <div class="grid grid-cols-2 gap-3">
        <!-- Home Delivery -->
        <button
          v-if="deliveryEnabled"
          class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
          :class="form.deliveryType === 'delivery'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'"
          @click="form.deliveryType = 'delivery'"
        >
          <TruckIcon
            class="w-7 h-7"
            :class="form.deliveryType === 'delivery' ? 'text-emerald-600' : 'text-gray-400'"
          />
          <span
            class="text-sm font-semibold"
            :class="form.deliveryType === 'delivery' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'"
          >
            {{ $t('checkout.delivery.delivery') }}
          </span>
          <span class="text-xs" :class="form.deliveryType === 'delivery' ? 'text-emerald-600' : 'text-gray-400'">
            {{ deliveryFeeLabel }}
          </span>
        </button>

        <!-- Pickup -->
        <button
          v-if="pickupEnabled"
          class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
          :class="form.deliveryType === 'pickup'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'"
          @click="form.deliveryType = 'pickup'"
        >
          <BuildingStorefrontIcon
            class="w-7 h-7"
            :class="form.deliveryType === 'pickup' ? 'text-emerald-600' : 'text-gray-400'"
          />
          <span
            class="text-sm font-semibold"
            :class="form.deliveryType === 'pickup' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'"
          >
            {{ $t('checkout.delivery.pickup') }}
          </span>
          <span class="text-xs" :class="form.deliveryType === 'pickup' ? 'text-emerald-600' : 'text-gray-400'">
            {{ $t('common.free') }}
          </span>
        </button>
      </div>
    </div>

    <!-- Address (only for delivery) -->
    <div v-if="form.deliveryType === 'delivery'" class="space-y-1.5">
      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {{ $t('checkout.delivery.address') }} <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <MapPinIcon class="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
        <textarea
          v-model="form.address"
          :placeholder="$t('checkout.delivery.address_placeholder')"
          rows="2"
          class="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
          :class="addressError
            ? 'border-red-400'
            : 'border-gray-200 dark:border-gray-700 focus:border-emerald-500'"
        />
      </div>
      <p v-if="addressError" class="text-xs text-red-500">{{ addressError }}</p>

      <!-- Map placeholder -->
      <div class="w-full h-28 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 mt-2">
        <div class="text-center">
          <MapPinIcon class="w-7 h-7 text-gray-400 mx-auto mb-1" />
          <p class="text-xs text-gray-400">{{ $t('checkout.delivery.map_placeholder') }}</p>
        </div>
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
      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {{ $t('checkout.delivery.notes') }}
      </label>
      <textarea
        v-model="form.notes"
        :placeholder="$t('checkout.delivery.notes_placeholder')"
        rows="2"
        class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 transition-colors"
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TruckIcon, BuildingStorefrontIcon, MapPinIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'

const { t } = useI18n()
const checkout = useCheckoutStore()
const store = useStorefrontStore()
const cart = useCart()
const form = checkout.form

const addressError = ref('')
const deliveryEnabled = computed(() => store.deliveryEnabled)
const pickupEnabled = computed(() => store.pickupEnabled)
const estimatedMinutes = computed(() => store.estimatedMinutes)
const deliveryFeeDisplay = computed(() => cart.formattedDeliveryFee.value)

const deliveryFeeLabel = computed(() => {
  const fee = store.deliveryFee
  return fee === 0 ? t('common.free') : `+${deliveryFeeDisplay.value}`
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
