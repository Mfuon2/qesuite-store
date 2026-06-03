<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="cartStore.isDrawerOpen"
        class="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        @click="cartStore.closeDrawer"
      />
    </Transition>

    <Transition name="drawer">
      <aside
        v-if="cartStore.isDrawerOpen"
        class="fixed z-50 bg-white  shadow-2xl
               bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl
               md:right-0 md:left-auto md:top-0 md:bottom-0 md:w-96 md:max-h-full md:rounded-none md:rounded-l-2xl
               flex flex-col"
        role="dialog"
        :aria-label="$t('cart.title')"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 ">
          <div class="flex items-center gap-2">
            <ShoppingCartIcon class="w-4.5 h-4.5" :style="{ color: 'var(--color-primary)' }" />
            <h2 class="font-bold text-gray-900  text-base">
              {{ $t('cart.title') }}
            </h2>
          </div>
          <button
            class="p-2 rounded-xl hover:bg-gray-100  transition-colors"
            @click="cartStore.closeDrawer"
          >
            <XMarkIcon class="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto">
          <!-- Empty state -->
          <div
            v-if="cartStore.items.length === 0"
            class="flex flex-col items-center justify-center h-full py-16 text-center px-5"
          >
            <div class="w-20 h-20 rounded-full bg-gray-100  flex items-center justify-center mb-4">
              <ShoppingCartIcon class="w-10 h-10 text-gray-400" />
            </div>
            <p class="font-semibold text-gray-700  mb-1">
              {{ $t('cart.empty') }}
            </p>
            <p class="text-sm text-gray-400  mb-5">
              {{ $t('cart.empty_hint') }}
            </p>
            <button
              class="text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-95"
              :style="{ backgroundColor: 'var(--color-primary)' }"
              @click="cartStore.closeDrawer"
            >
              {{ $t('cart.continue_shopping') }}
            </button>
          </div>

          <!-- Cart items -->
          <TransitionGroup
            v-else
            name="cart-item"
            tag="ul"
            class="divide-y divide-gray-100 "
          >
            <li
              v-for="item in cartStore.items"
              :key="item.product_id"
              class="flex gap-3 px-5 py-3.5"
            >
              <!-- Image -->
              <div class="w-16 h-16 rounded-xl overflow-hidden bg-gray-100  flex-shrink-0">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.product_name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <PhotoIcon class="w-7 h-7 text-gray-400" />
                </div>
              </div>

              <!-- Details -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900  line-clamp-1">
                  {{ item.product_name }}
                </p>
                <p class="text-sm font-bold mt-0.5" :style="{ color: 'var(--color-primary)' }">
                  {{ formatPrice(item.sale_price !== null ? item.sale_price : item.price) }}
                </p>
                <!-- Quantity controls -->
                <div class="flex items-center gap-2 mt-2">
                  <div class="flex items-center bg-gray-100  rounded-lg overflow-hidden">
                    <button
                      class="w-7 h-7 flex items-center justify-center text-gray-600  hover:bg-gray-200  transition-colors"
                      @click="cart.decrement(item.product_id)"
                    >
                      <MinusIcon class="w-3.5 h-3.5" />
                    </button>
                    <span class="w-7 text-center text-sm font-semibold text-gray-900 ">
                      {{ item.quantity }}
                    </span>
                    <button
                      class="w-7 h-7 flex items-center justify-center text-white transition-colors"
                      :style="{ backgroundColor: 'var(--color-primary)' }"
                      :disabled="item.quantity >= item.stock"
                      @click="cart.increment(item.product_id)"
                    >
                      <PlusIcon class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span class="text-xs text-gray-400  font-medium">
                    = {{ formatPrice((item.sale_price !== null ? item.sale_price : item.price) * item.quantity) }}
                  </span>
                </div>
              </div>

              <!-- Remove -->
              <button
                class="self-start p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50  transition-colors"
                @click="cartStore.removeItem(item.product_id)"
                :aria-label="`Remove ${item.product_name}`"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </li>
          </TransitionGroup>
        </div>

        <!-- Footer totals + checkout -->
        <div
          v-if="cartStore.items.length > 0"
          class="border-t border-gray-100  px-5 py-4 space-y-2 pb-safe"
        >
          <div class="flex justify-between text-sm text-gray-600 ">
            <span>{{ $t('cart.subtotal') }}</span>
            <span class="font-semibold text-gray-900 ">{{ cart.formattedSubtotal.value }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 ">
            <span>{{ $t('cart.delivery_fee') }}</span>
            <span class="font-semibold text-gray-900 ">
              {{ deliveryFeeDisplay }}
            </span>
          </div>
          <div class="flex justify-between text-base font-bold text-gray-900  pt-2 border-t border-gray-100 ">
            <span>{{ $t('cart.total') }}</span>
            <span :style="{ color: 'var(--color-primary)' }">{{ cart.formattedTotal.value }}</span>
          </div>

          <RouterLink
            :to="`/${slug}/checkout`"
            class="block w-full text-center text-white font-bold py-3.5 rounded-2xl mt-3 transition-all active:scale-[0.98] text-base"
            :style="{ backgroundColor: 'var(--color-primary)' }"
            @click="cartStore.closeDrawer"
          >
            {{ $t('cart.checkout') }}
          </RouterLink>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ShoppingCartIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline'
import { useCartStore } from '@/stores/cart'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'

const cartStore = useCartStore()
const storefrontStore = useStorefrontStore()
const cart = useCart()

const slug = computed(() => storefrontStore.slug)

const deliveryFeeDisplay = computed(() => {
  if (cartStore.deliveryFee === 0) return 'Free'
  return cart.formattedDeliveryFee.value
})

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}
</script>

<style scoped>
.backdrop-enter-active { transition: opacity 0.2s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.drawer-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-leave-active { transition: transform 0.25s ease-in; }
@media (max-width: 767px) {
  .drawer-enter-from, .drawer-leave-to { transform: translateY(100%); }
}
@media (min-width: 768px) {
  .drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
}

.cart-item-enter-active { transition: all 0.2s ease-out; }
.cart-item-leave-active { transition: all 0.15s ease-in; }
.cart-item-enter-from { opacity: 0; transform: translateX(-10px); }
.cart-item-leave-to { opacity: 0; transform: translateX(10px); }
</style>
