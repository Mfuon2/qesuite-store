<template>
  <div class="space-y-5 animate-fade-in">
    <div>
      <h2 class="text-xl font-bold text-slate-950 mb-1">
        {{ $t('checkout.payment.title') }}
      </h2>
      <p class="text-sm text-slate-500">Step 3 of 4</p>
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
            <label class="block text-xs font-semibold text-slate-700">
              {{ $t('checkout.payment.mpesa_phone') }}
            </label>
            <input
              v-model="form.mpesaPhone"
              type="tel"
              inputmode="tel"
              :placeholder="form.phone || '0712 345 678'"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-950 placeholder-slate-400 focus:border-emerald-500 transition-colors"
            />
            <p class="text-xs text-slate-500">
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
    <p v-if="checkout.error" class="text-sm text-red-500 text-center bg-red-50  rounded-xl p-3">
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
import PaymentOption from './PaymentOption.vue'

const { t } = useI18n()
const checkout = useCheckoutStore()

const form = checkout.form

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
