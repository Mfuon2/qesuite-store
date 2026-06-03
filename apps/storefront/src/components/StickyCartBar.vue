<template>
  <Transition name="slide-up">
    <div
      v-if="cartStore.itemCount > 0 && route.name !== 'checkout'"
      class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pb-safe pointer-events-none"
    >
      <button
        class="pointer-events-auto w-full max-w-xl mx-auto flex items-center justify-between text-white rounded-2xl px-5 py-3.5 shadow-xl active:scale-[0.98] transition-all"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click="cartStore.openDrawer"
      >
        <div class="flex items-center gap-2">
          <span
            class="bg-white/25 rounded-lg px-2.5 py-0.5 text-sm font-bold"
          >
            {{ cartStore.itemCount }}
          </span>
          <span class="font-semibold text-sm">
            {{ $t('cart.view_cart') }}
          </span>
        </div>
        <span class="font-bold text-base">
          {{ cart.formattedTotal.value }}
        </span>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useCart } from '@/composables/useCart'
import { useRoute } from 'vue-router'

const cartStore = useCartStore()
const cart = useCart()
const route = useRoute()
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-leave-active { transition: all 0.2s ease-in; }
.slide-up-enter-from { transform: translateY(100px); opacity: 0; }
.slide-up-leave-to { transform: translateY(100px); opacity: 0; }
</style>
