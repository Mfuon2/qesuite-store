<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center bg-gray-50 ">
    <!-- Icon -->
    <div class="w-24 h-24 rounded-full bg-gray-100  flex items-center justify-center mb-6">
      <WifiIcon class="w-12 h-12 text-gray-400 line-through" />
    </div>

    <h1 class="text-2xl font-extrabold text-gray-900  mb-2">
      {{ $t('offline.title') }}
    </h1>
    <p class="text-gray-500  text-sm mb-1">
      {{ $t('offline.subtitle') }}
    </p>
    <p class="text-gray-400  text-sm mb-8 max-w-xs">
      {{ $t('offline.message') }}
    </p>

    <!-- Swahili translation -->
    <div class="bg-amber-50  border border-amber-200  rounded-2xl px-5 py-4 mb-8 max-w-xs">
      <p class="text-amber-800  text-sm font-medium">
        Hakuna mtandao. Tafadhali angalia muunganisho wako na ujaribu tena.
      </p>
    </div>

    <button
      class="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      @click="retry"
    >
      <ArrowPathIcon class="w-4 h-4" />
      {{ $t('offline.retry') }}
    </button>

    <!-- Cached products section -->
    <div v-if="cachedProducts.length > 0" class="mt-12 w-full max-w-lg text-left">
      <h2 class="text-base font-bold text-gray-700  px-4 mb-4">
        {{ $t('offline.cached_products') }}
      </h2>
      <div class="grid grid-cols-2 gap-3 px-4">
        <div
          v-for="product in cachedProducts"
          :key="product.id"
          class="bg-white  rounded-2xl p-3 border border-gray-100  opacity-75"
        >
          <div class="aspect-square rounded-xl bg-gray-100  mb-2 overflow-hidden">
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
          </div>
          <p class="text-xs font-semibold text-gray-900  line-clamp-2">{{ product.name }}</p>
          <p class="text-xs font-bold mt-1" :style="{ color: 'var(--color-primary)' }">
            {{ formatPrice(product.sale_price ?? product.price) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WifiIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'

const store = useStorefrontStore()
const cart = useCart()

// Show cached products if available from store
const cachedProducts = computed(() => store.activeProducts.slice(0, 6))

function retry() {
  window.location.reload()
}

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}
</script>
