<template>
  <div class="space-y-5 animate-fade-in">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {{ $t('checkout.payment.title') }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Step 3 of 4</p>
    </div>

    <!-- Order Summary -->
    <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
      <p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
        {{ $t('checkout.payment.order_summary') }}
      </p>
      <div
        v-for="item in cartItems"
        :key="item.product_id"
        class="flex justify-between text-sm text-gray-600 dark:text-gray-400"
      >
        <span class="truncate mr-2">{{ item.product_name }} × {{ item.quantity }}</span>
        <span class="font-medium flex-shrink-0 text-gray-900 dark:text-white">
          {{ formatPrice((item.sale_price !== null ? item.sale_price : item.price) * item.quantity) }}
        </span>
      </div>
      <div class="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ $t('cart.delivery_fee') }}</span>
          <span>{{ deliveryFeeDisplay }}</span>
        </div>
        <div class="flex justify-between font-bold text-gray-900 dark:text-white">
          <span>{{ $t('cart.total') }}</span>
          <span :style="{ color: 'var(--color-primary)' }">{{ cart.formattedTotal.value }}</span>
        </div>
      </div>
    </div>

    <!-- Payment method selection -->
    <div class="space-y-3">
      <!-- Pay on Delivery -->
      <PaymentOption
        value="pay_on_delivery"
        :selected="form.paymentMethod === 'pay_on_delivery'"
        :title="$t('checkout.payment.pay_on_delivery')"
        :description="$t('checkout.payment.pay_on_delivery_desc')"
        icon="💵"
        @select="form.paymentMethod = 'pay_on_delivery'"
      />

      <!-- M-Pesa -->
      <div>
        <PaymentOption
          value="mpesa"
          :selected="form.paymentMethod === 'mpesa'"
          :title="$t('checkout.payment.mpesa')"
          :description="$t('checkout.payment.mpesa_desc')"
          icon="📱"
          @select="form.paymentMethod = 'mpesa'"
        />
        <!-- M-Pesa phone input (shown when selected) -->
        <Transition name="expand">
          <div v-if="form.paymentMethod === 'mpesa'" class="mt-2 px-4 space-y-2">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              {{ $t('checkout.payment.mpesa_phone') }}
            </label>
            <input
              v-model="form.mpesaPhone"
              type="tel"
              inputmode="tel"
              :placeholder="form.phone || '0712 345 678'"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 transition-colors"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ $t('checkout.payment.mpesa_phone_hint') }}
            </p>
            <button
              class="text-xs font-medium"
              :style="{ color: 'var(--color-primary)' }"
              @click="form.mpesaPhone = form.phone"
            >
              {{ $t('checkout.payment.mpesa_phone_same') }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Card Payment -->
      <PaymentOption
        value="stripe"
        :selected="form.paymentMethod === 'stripe'"
        :title="$t('checkout.payment.stripe')"
        :description="$t('checkout.payment.stripe_desc')"
        icon="💳"
        @select="form.paymentMethod = 'stripe'"
      />
    </div>

    <!-- Error -->
    <p v-if="checkout.error" class="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
      {{ checkout.error }}
    </p>

    <!-- Place Order button -->
    <button
      class="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      :disabled="checkout.submitting"
      @click="handlePlaceOrder"
    >
      <svg v-if="checkout.submitting" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" />
      </svg>
      <span>{{ checkout.submitting ? $t('common.loading') : $t('checkout.place_order') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCheckoutStore } from '@/stores/checkout'
import { useCartStore } from '@/stores/cart'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'
import PaymentOption from './PaymentOption.vue'

const { t } = useI18n()
const checkout = useCheckoutStore()
const cartStore = useCartStore()
const storeStore = useStorefrontStore()
const cart = useCart()

const form = checkout.form
const cartItems = computed(() => cartStore.items)

const deliveryFeeDisplay = computed(() => {
  const fee = storeStore.deliveryFee
  return fee === 0 ? t('common.free') : cart.formattedDeliveryFee.value
})

function formatPrice(amount: number) {
  return cart.formatPrice(amount)
}

async function handlePlaceOrder() {
  await checkout.placeOrderAction()
}
</script>

<style scoped>
.expand-enter-active { transition: all 0.2s ease-out; }
.expand-leave-active { transition: all 0.15s ease-in; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 200px; }
</style>
