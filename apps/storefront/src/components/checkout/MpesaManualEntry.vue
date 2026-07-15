<template>
  <div class="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white text-left">
    <!-- Submitted state -->
    <div v-if="checkout.codeSubmitted" class="p-5 flex flex-col items-center gap-3 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 animate-bounce-in">
        <CheckCircleIcon class="w-10 h-10 text-emerald-600" />
      </div>
      <p class="font-bold text-slate-950">{{ $t('payment.manual_code_received') }}</p>
      <p class="text-sm text-slate-500">{{ $t('payment.manual_code_received_desc') }}</p>
    </div>

    <!-- Instructions + code entry -->
    <div v-else class="p-5 space-y-4">
      <div>
        <p class="font-bold text-slate-950">{{ $t('payment.manual_title') }}</p>
        <p class="text-sm text-slate-500 mt-0.5">{{ $t('payment.manual_subtitle') }}</p>
      </div>

      <!-- How to pay -->
      <ol class="space-y-2 text-sm text-slate-700">
        <li class="flex gap-2">
          <span class="font-bold" :style="{ color: 'var(--color-primary)' }">1.</span>
          <span>{{ payInstruction }}</span>
        </li>
        <li v-if="accountRef" class="flex gap-2">
          <span class="font-bold" :style="{ color: 'var(--color-primary)' }">2.</span>
          <span>{{ $t('payment.manual_account', { account: accountRef }) }}</span>
        </li>
        <li class="flex gap-2">
          <span class="font-bold" :style="{ color: 'var(--color-primary)' }">{{ accountRef ? 3 : 2 }}.</span>
          <span>{{ $t('payment.manual_amount', { amount: formattedTotal }) }}</span>
        </li>
        <li class="flex gap-2">
          <span class="font-bold" :style="{ color: 'var(--color-primary)' }">{{ accountRef ? 4 : 3 }}.</span>
          <span>{{ $t('payment.manual_enter_code') }}</span>
        </li>
      </ol>

      <!-- Code input -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-700">
          {{ $t('payment.manual_code_label') }}
        </label>
        <input
          v-model="checkout.mpesaCode"
          type="text"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
          maxlength="10"
          placeholder="e.g. QGH7XK9L2T"
          class="w-full px-4 py-3 rounded-xl border text-sm bg-white text-slate-950 placeholder-slate-400 tracking-widest font-mono uppercase transition-colors outline-none"
          :class="checkout.codeError
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'"
          @input="checkout.codeError = null"
        />
        <p v-if="checkout.codeError" class="text-xs text-red-500">{{ checkout.codeError }}</p>
        <p v-else-if="localError" class="text-xs text-red-500">{{ localError }}</p>
      </div>

      <button
        class="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        :disabled="checkout.codeSubmitting"
        @click="handleSubmit"
      >
        <svg v-if="checkout.codeSubmitting" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" />
        </svg>
        <span>{{ checkout.codeSubmitting ? $t('common.loading') : $t('payment.manual_submit') }}</span>
      </button>

      <!-- Fall back to STK prompt -->
      <button
        class="w-full text-xs font-medium text-center"
        :style="{ color: 'var(--color-primary)' }"
        @click="$emit('use-stk')"
      >
        {{ $t('payment.manual_use_stk') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { useStorefrontStore } from '@/stores/store'
import { useCart } from '@/composables/useCart'
import { validateMpesaCode, displayPhone } from '@qesuite/shared'

const { t } = useI18n()
const checkout = useCheckoutStore()
const store = useStorefrontStore()
const cart = useCart()

defineEmits<{ 'use-stk': [] }>()

const localError = ref('')

const settings = computed(() => store.config?.settings)
const tenant = computed(() => store.config?.tenant)

const formattedTotal = computed(() =>
  checkout.placedOrder ? cart.formatPrice(checkout.placedOrder.total) : ''
)

const accountRef = computed(() =>
  settings.value?.mpesa_payment_type === 'paybill' ? settings.value?.mpesa_account_ref : null
)

// Build the "where to send money" instruction from store settings,
// falling back to Send Money on the store's phone number.
const payInstruction = computed(() => {
  const type = settings.value?.mpesa_payment_type
  const number = settings.value?.mpesa_payment_number
  if (type === 'till' && number) return t('payment.manual_till', { number })
  if (type === 'paybill' && number) return t('payment.manual_paybill', { number })
  if (number) return t('payment.manual_send_money', { number: displayPhone(number) || number })
  const storePhone = tenant.value?.phone
  return storePhone
    ? t('payment.manual_send_money', { number: displayPhone(storePhone) || storePhone })
    : t('payment.manual_ask_store')
})

async function handleSubmit() {
  localError.value = ''
  if (!validateMpesaCode(checkout.mpesaCode)) {
    localError.value = t('payment.manual_code_invalid')
    return
  }
  await checkout.submitMpesaCodeAction()
}
</script>
