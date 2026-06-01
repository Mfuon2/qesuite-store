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
        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 text-sm font-medium">
          <span>🇰🇪</span>
          <span>+254</span>
          <span class="text-slate-300">|</span>
        </div>
        <input
          v-model="form.phone"
          type="tel"
          inputmode="tel"
          :placeholder="$t('checkout.contact.phone_placeholder')"
          class="w-full pl-[80px] pr-4 py-3.5 rounded-xl border transition-colors outline-none text-sm bg-white text-slate-950 placeholder-slate-400"
          :class="errors.phone
            ? 'border-red-400 focus:ring-red-300 focus:border-red-400'
            : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'"
          @blur="validatePhone"
        />
      </div>
      <p v-if="errors.phone" class="text-xs text-red-500">{{ errors.phone }}</p>
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
import { useCheckoutStore } from '@/stores/checkout'
import { validatePhone as validateKenyaPhone, formatPhone } from '@qesuite/shared'

const { t } = useI18n()
const checkout = useCheckoutStore()
const form = checkout.form

const errors = reactive({ phone: '', name: '' })

function validatePhone() {
  const phone = form.phone.trim()
  if (!phone) {
    errors.phone = t('checkout.contact.phone_required')
  } else if (!validateKenyaPhone(phone)) {
    errors.phone = t('checkout.contact.phone_invalid')
  } else {
    errors.phone = ''
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
    // Normalize to E.164 (+254XXXXXXXXX) before proceeding so backend always gets a clean number
    const normalized = formatPhone(form.phone.trim())
    if (normalized) form.phone = normalized
    checkout.nextStep()
  }
}
</script>
