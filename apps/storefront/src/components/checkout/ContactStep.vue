<template>
  <div class="space-y-5 animate-fade-in">
    <div>
      <h2 class="text-xl font-bold text-slate-950 mb-1">
        {{ $t('checkout.contact.title') }}
      </h2>
      <p class="text-sm text-slate-500">
        {{ $t('checkout.steps.contact') }} · Step 1 of 4
      </p>
    </div>

    <!-- Phone -->
    <div class="space-y-1.5">
      <label class="block text-sm font-semibold text-slate-700">
        {{ $t('checkout.contact.phone') }} <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 text-sm font-medium select-none pointer-events-none">
          <!-- Kenya flag -->
          <svg viewBox="0 0 24 16" class="h-3 w-[18px] rounded-[2px]" aria-hidden="true">
            <rect width="24" height="16" fill="#ffffff" />
            <rect width="24" height="4.6" y="0" fill="#141414" />
            <rect width="24" height="4.8" y="5.6" fill="#bb2026" />
            <rect width="24" height="4.6" y="11.4" fill="#1e7c3b" />
            <ellipse cx="12" cy="8" rx="2.6" ry="5.4" fill="#bb2026" stroke="#ffffff" stroke-width="1" />
          </svg>
          <span class="text-slate-300">|</span>
        </div>
        <input
          v-model="form.phone"
          type="tel"
          inputmode="tel"
          maxlength="17"
          placeholder="07XX XXX XXX"
          class="w-full pl-[56px] pr-10 py-3.5 rounded-xl border transition-colors outline-none text-sm bg-white text-slate-950 placeholder-slate-400"
          :class="errors.phone
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : phoneValid
              ? 'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'"
          @input="onPhoneInput"
          @blur="validatePhone"
        />
        <!-- Valid tick -->
        <div class="absolute right-3.5 top-1/2 -translate-y-1/2">
          <svg v-if="phoneValid" class="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          <svg v-else-if="errors.phone" class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
      </div>
      <p v-if="errors.phone" class="text-xs text-red-500 flex items-center gap-1">
        <ExclamationTriangleIcon class="h-3.5 w-3.5 shrink-0" /> {{ errors.phone }}
      </p>
      <p v-else class="text-xs text-slate-400">
        Safaricom, Airtel or Telkom — e.g. <strong>0712 345 678</strong> or <strong>0110 123 456</strong>
      </p>
    </div>

    <!-- Name -->
    <div class="space-y-1.5">
      <label class="block text-sm font-semibold text-slate-700">
        {{ $t('checkout.contact.name') }} <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.name"
        type="text"
        :placeholder="$t('checkout.contact.name_placeholder')"
        class="w-full px-4 py-3.5 rounded-xl border transition-colors outline-none text-sm bg-white text-slate-950 placeholder-slate-400"
        :class="errors.name
          ? 'border-red-400 focus:ring-red-300 focus:border-red-400'
          : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'"
        @blur="validateName"
      />
      <p v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</p>
    </div>

    <!-- Continue button -->
    <button
      class="w-full py-4 rounded-2xl text-white font-bold text-base mt-4 transition-all active:scale-[0.98]"
      :style="{ backgroundColor: 'var(--color-primary)' }"
      @click="handleNext"
    >
      {{ $t('checkout.next') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { validatePhone as isValidKenyanPhone, displayPhone } from '@qesuite/shared'

const { t } = useI18n()
const checkout = useCheckoutStore()
const form = checkout.form

const errors = reactive({ phone: '', name: '' })
const phoneValid = ref(false)

function onPhoneInput() {
  // Keep digits, spaces, and a leading + while typing — accepts 07xx local
  // format as well as +254/254 international format (e.g. pasted from contacts)
  form.phone = form.phone.replace(/[^\d\s+]/g, '')
  // Real-time: show green tick as soon as valid, clear error
  const v = isValidKenyanPhone(form.phone.trim())
  phoneValid.value = v
  if (v) errors.phone = ''
}

function validatePhone() {
  const phone = form.phone.trim()
  if (!phone) {
    errors.phone = 'Phone number is required'
    phoneValid.value = false
  } else if (!isValidKenyanPhone(phone)) {
    errors.phone = 'Enter a valid Kenyan number starting with 07 or 01 (e.g. 0712 345 678)'
    phoneValid.value = false
  } else {
    errors.phone = ''
    phoneValid.value = true
    // Normalize to the familiar local display format regardless of how it
    // was typed (0712…, +254712…, or 254712…) — the API re-normalizes to
    // 254… on submit, but the form itself should show one consistent shape.
    form.phone = displayPhone(phone).replace(/\s+/g, ' ')
  }
}

function validateName() {
  if (!form.name.trim()) {
    errors.name = t('checkout.contact.name_required')
  } else {
    errors.name = ''
  }
}

function handleNext() {
  validatePhone()
  validateName()
  if (!errors.phone && !errors.name) {
    // Keep the familiar 07…/01… format in the form; the API normalizes to 254… on submit
    form.phone = form.phone.trim()
    checkout.nextStep()
  }
}
</script>
