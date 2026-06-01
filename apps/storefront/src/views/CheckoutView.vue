<template>
  <section class="py-4 sm:py-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button
          v-if="!isConfirmation"
          class="grid h-10 w-10 place-items-center rounded-xl border border-slate-100 bg-white text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition hover:bg-emerald-50 hover:text-emerald-700"
          @click="handleBack"
          aria-label="Go back"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-extrabold leading-tight text-slate-950">Checkout</h1>
          <p class="mt-1 text-sm font-medium text-slate-500">{{ storeName }} · {{ cartStore.itemCount }} item{{ cartStore.itemCount === 1 ? '' : 's' }}</p>
        </div>
      </div>
      <RouterLink
        :to="`/${slug}`"
        class="hidden rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition hover:bg-emerald-50 hover:text-emerald-700 sm:inline-flex"
      >
        Continue shopping
      </RouterLink>
    </div>

    <div
      v-if="cartStore.items.length === 0 && checkout.currentStep < 4"
      class="rounded-[1.35rem] border border-slate-100 bg-white/95 px-6 py-16 text-center shadow-[0_10px_32px_rgba(15,23,42,0.035)]"
    >
      <ShoppingCartIcon class="mx-auto h-12 w-12 text-slate-300" />
      <p class="mt-3 text-base font-extrabold text-slate-700">Your cart is empty</p>
      <RouterLink
        :to="`/${slug}`"
        class="mt-4 inline-flex rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white transition active:scale-95"
      >
        {{ $t('cart.continue_shopping') }}
      </RouterLink>
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0 space-y-4">
        <div class="rounded-[1.35rem] border border-slate-100 bg-white/95 p-3 shadow-[0_10px_32px_rgba(15,23,42,0.035)] sm:p-4">
          <CheckoutProgress
            :current-step="checkout.currentStep"
            @go-to-step="checkout.goToStep"
          />
        </div>

        <Transition name="step" mode="out-in">
          <div
            :key="checkout.currentStep"
            class="rounded-[1.35rem] border border-slate-100 bg-white/95 p-4 shadow-[0_10px_32px_rgba(15,23,42,0.035)] sm:p-6"
          >
            <ContactStep v-if="checkout.currentStep === 1" />
            <DeliveryStep v-else-if="checkout.currentStep === 2" />
            <PaymentStep v-else-if="checkout.currentStep === 3" />
            <ConfirmationStep v-else-if="checkout.currentStep === 4" />
          </div>
        </Transition>
      </div>

      <aside class="lg:sticky lg:top-20 lg:self-start">
        <div class="rounded-[1.35rem] border border-slate-100 bg-white/95 p-4 shadow-[0_10px_32px_rgba(15,23,42,0.035)]">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-extrabold text-slate-950">Order Summary</h2>
            <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
              {{ cartStore.itemCount }} item{{ cartStore.itemCount === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
            <div
              v-for="item in cartStore.items"
              :key="item.product_id"
              class="flex gap-3 rounded-2xl border border-slate-100 bg-white p-2.5"
            >
              <div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-50">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.product_name"
                  class="h-full w-full object-cover"
                />
                <ShoppingBagIcon v-else class="h-6 w-6 text-slate-300" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-extrabold text-slate-950">{{ item.product_name }}</p>
                <p class="mt-1 text-xs font-medium text-slate-500">Qty {{ item.quantity }}</p>
                <p class="mt-1 text-sm font-extrabold text-emerald-700">{{ formatLineTotal(item) }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <div class="flex justify-between text-sm font-medium text-slate-500">
              <span>Subtotal</span>
              <span class="text-slate-700">{{ cart.formattedSubtotal.value }}</span>
            </div>
            <div class="flex justify-between text-sm font-medium text-slate-500">
              <span>{{ $t('cart.delivery_fee') }}</span>
              <span class="text-slate-700">{{ deliveryFeeLabel }}</span>
            </div>
            <div class="flex justify-between text-base font-extrabold text-slate-950">
              <span>{{ $t('cart.total') }}</span>
              <span class="text-emerald-700">{{ cart.formattedTotal.value }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeftIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { useCartStore } from '@/stores/cart'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'
import CheckoutProgress from '@/components/checkout/CheckoutProgress.vue'
import ContactStep from '@/components/checkout/ContactStep.vue'
import DeliveryStep from '@/components/checkout/DeliveryStep.vue'
import PaymentStep from '@/components/checkout/PaymentStep.vue'
import ConfirmationStep from '@/components/checkout/ConfirmationStep.vue'
import type { CartItem } from '@qesuite/types'

const route = useRoute()
const checkout = useCheckoutStore()
const cartStore = useCartStore()
const storefrontStore = useStorefrontStore()
const cart = useCart()

const slug = computed(() => route.params.slug as string)
const isConfirmation = computed(() => checkout.currentStep === 4)
const storeName = computed(() => storefrontStore.storeName || 'Store')
const deliveryFeeLabel = computed(() => {
  if (checkout.form.deliveryType === 'pickup' || cartStore.deliveryFee === 0) return 'Free'
  return cart.formattedDeliveryFee.value
})

function handleBack() {
  if (checkout.currentStep === 1) {
    window.history.back()
  } else {
    checkout.prevStep()
  }
}

function formatLineTotal(item: CartItem) {
  const price = item.sale_price !== null ? item.sale_price : item.price
  return cart.formatPrice(price * item.quantity)
}
</script>

<style scoped>
.step-enter-active, .step-leave-active { transition: all 0.2s ease; }
.step-enter-from { opacity: 0; transform: translateY(8px); }
.step-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
