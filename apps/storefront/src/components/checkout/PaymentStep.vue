<template>
  <div class="space-y-5 animate-fade-in">
    <div>
      <h2 class="text-xl font-bold text-slate-950 mb-1">
        {{ $t('checkout.payment.title') }}
      </h2>
      <p class="text-sm text-slate-500">Step 3 of 4</p>
    </div>

    <!-- M-Pesa is the only payment method — choose how to pay -->
    <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100">
        <DevicePhoneMobileIcon class="h-5 w-5 text-emerald-700" />
      </span>
      <div>
        <p class="font-bold text-slate-950">{{ $t('checkout.payment.mpesa') }}</p>
        <p class="text-xs text-slate-500">{{ $t('checkout.payment.mpesa_only_note') }}</p>
      </div>
    </div>

    <div class="space-y-3">
      <!-- Primary: pay manually, enter the transaction code -->
      <PaymentOption
        value="manual"
        :selected="form.mpesaMode === 'manual'"
        :title="$t('checkout.payment.mpesa_manual')"
        :description="$t('checkout.payment.mpesa_manual_desc')"
        :icon="ClipboardDocumentCheckIcon"
        @select="form.mpesaMode = 'manual'"
      />

      <!-- Secondary: STK prompt -->
      <PaymentOption
        value="stk"
        :selected="form.mpesaMode === 'stk'"
        :title="$t('checkout.payment.mpesa_stk')"
        :description="$t('checkout.payment.mpesa_stk_desc', { phone: displayedPhone })"
        :icon="BellAlertIcon"
        @select="form.mpesaMode = 'stk'"
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
import { BellAlertIcon, ClipboardDocumentCheckIcon, DevicePhoneMobileIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { displayPhone } from '@qesuite/shared'
import PaymentOption from './PaymentOption.vue'

const checkout = useCheckoutStore()

const form = checkout.form

const displayedPhone = computed(() => displayPhone(form.phone) || form.phone)

async function handlePlaceOrder() {
  await checkout.placeOrderAction()
}
</script>
