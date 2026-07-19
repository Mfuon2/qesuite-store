<template>
  <div class="space-y-6 animate-fade-in text-center">
    <!-- Success animation -->
    <div class="flex flex-col items-center gap-4 py-4">
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center animate-bounce-in"
        :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }"
      >
        <CheckBadgeIcon class="w-12 h-12" :style="{ color: 'var(--color-primary)' }" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 ">
          {{ $t('checkout.confirmation.title') }}
        </h2>
        <p class="text-gray-500  mt-1">
          {{ $t('checkout.confirmation.subtitle') }}
        </p>
      </div>
    </div>

    <!-- M-Pesa payment: manual code entry (primary) or STK prompt (secondary) -->
    <MpesaManualEntry
      v-if="order && checkout.form.mpesaMode === 'manual'"
      @use-stk="switchToStk"
    />
    <MpesaPaymentFlow
      v-else-if="order"
      :status="checkout.mpesaStatus"
      :phone="checkout.form.phone"
      @retry="handleMpesaRetry"
    />

    <!-- Order details card -->
    <div
      v-if="order"
      class="bg-gray-50  rounded-2xl p-5 text-left space-y-3"
    >
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs text-gray-500  font-medium uppercase tracking-wide">
            {{ $t('checkout.confirmation.tracking_code') }}
          </p>
          <p class="text-xl font-bold text-gray-900  tracking-widest mt-0.5">
            {{ order.tracking_code }}
          </p>
        </div>
        <button
          class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          :style="{ color: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }"
          @click="copyCode"
        >
          <CheckIcon v-if="copied" class="h-3.5 w-3.5" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <div class="border-t border-gray-200  pt-3 space-y-1.5">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 ">{{ $t('checkout.confirmation.order_id') }}</span>
          <span class="font-medium text-gray-900  text-xs font-mono">{{ order.id.slice(0, 8) }}...</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 ">{{ $t('cart.total') }}</span>
          <span class="font-bold" :style="{ color: 'var(--color-primary)' }">
            {{ formatPrice(order.total) }}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 ">{{ $t('checkout.payment.title') }}</span>
          <span class="font-medium text-gray-900  capitalize">
            {{ order.payment_method?.replace('_', ' ') }}
          </span>
        </div>
      </div>
    </div>

    <!-- CTA buttons -->
    <div class="space-y-3">
      <RouterLink
        v-if="order"
        :to="`/${slug}/track/${order.tracking_code}`"
        class="block w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98]"
        :style="{ backgroundColor: 'var(--color-primary)' }"
      >
        {{ $t('checkout.confirmation.track_order') }}
      </RouterLink>
      <RouterLink
        :to="`/${slug}`"
        class="block w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.98] border-2 text-gray-700  border-gray-200  hover:bg-gray-50 "
        @click="checkout.reset"
      >
        {{ $t('checkout.confirmation.continue_shopping') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'
import MpesaPaymentFlow from './MpesaPaymentFlow.vue'
import MpesaManualEntry from './MpesaManualEntry.vue'

const checkout = useCheckoutStore()
const store = useStorefrontStore()
const cart = useCart()

const order = computed(() => checkout.placedOrder)
const slug = computed(() => store.slug)
const copied = ref(false)

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}

function copyCode() {
  if (!order.value) return
  navigator.clipboard.writeText(order.value.tracking_code).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}

async function handleMpesaRetry() {
  if (!order.value) return
  await checkout.startMpesaFlow(order.value.id)
}

async function switchToStk() {
  if (!order.value) return
  checkout.form.mpesaMode = 'stk'
  await checkout.startMpesaFlow(order.value.id)
}
</script>
