<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center bg-gray-50 ">
    <!-- Animated checkmark -->
    <div class="relative mb-6">
      <div
        class="w-28 h-28 rounded-full flex items-center justify-center animate-bounce-in"
        :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }"
      >
        <CheckCircleIcon
          class="w-16 h-16 animate-bounce-in"
          :style="{ color: 'var(--color-primary)' }"
        />
      </div>
      <!-- Confetti particles -->
      <span
        v-for="i in 8"
        :key="i"
        class="absolute w-2 h-2 rounded-full animate-ping opacity-75"
        :style="particleStyle(i)"
      />
    </div>

    <h1 class="text-3xl font-extrabold text-gray-900  mb-2">
      {{ $t('checkout.confirmation.title') }}
    </h1>
    <p class="text-gray-500  mb-8 max-w-xs">
      {{ $t('checkout.confirmation.subtitle') }}
    </p>

    <!-- Order details -->
    <div
      v-if="order"
      class="w-full max-w-sm bg-white  rounded-3xl p-6 shadow-lg border border-gray-100  mb-8 text-left space-y-4"
    >
      <!-- Tracking code highlight -->
      <div class="text-center">
        <p class="text-xs font-medium text-gray-500  uppercase tracking-wider mb-2">
          {{ $t('checkout.confirmation.tracking_code') }}
        </p>
        <div
          class="font-mono text-2xl font-extrabold tracking-widest py-3 px-4 rounded-2xl"
          :style="{ color: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }"
        >
          {{ order.tracking_code }}
        </div>
        <p class="text-xs text-gray-400 mt-2">Save this code to track your order</p>
      </div>

      <div class="border-t border-gray-100  pt-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 ">{{ $t('checkout.confirmation.order_id') }}</span>
          <span class="font-mono text-xs text-gray-700 ">{{ order.id.slice(0, 8) }}...</span>
        </div>
        <div v-if="order.customer_name" class="flex justify-between text-sm">
          <span class="text-gray-500 ">Name</span>
          <span class="font-medium text-gray-900 ">{{ order.customer_name }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 ">{{ $t('cart.total') }}</span>
          <span class="font-bold" :style="{ color: 'var(--color-primary)' }">
            {{ formatPrice(order.total) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="w-full max-w-sm space-y-3">
      <RouterLink
        v-if="order"
        :to="`/${slug}/track/${order.tracking_code}`"
        class="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98]"
        :style="{ backgroundColor: 'var(--color-primary)' }"
      >
        <TruckIcon class="w-5 h-5" />
        {{ $t('checkout.confirmation.track_order') }}
      </RouterLink>
      <RouterLink
        :to="`/${slug}`"
        class="flex items-center justify-center w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] border-2 border-gray-200  text-gray-700  hover:bg-gray-50 "
        @click="checkout.reset()"
      >
        {{ $t('checkout.confirmation.continue_shopping') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CheckCircleIcon, TruckIcon } from '@heroicons/vue/24/solid'
import { useCheckoutStore } from '@/stores/checkout'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'

const route = useRoute()
const checkout = useCheckoutStore()
const store = useStorefrontStore()
const cart = useCart()

const order = computed(() => checkout.placedOrder)
const slug = computed(() => route.params.slug as string || store.slug)

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}

function particleStyle(i: number) {
  const angle = (i / 8) * 360
  const distance = 55
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const colors = ['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4']
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    backgroundColor: colors[i - 1],
    animationDelay: `${i * 0.1}s`,
    animationDuration: '1s',
  }
}
</script>
