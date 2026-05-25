<template>
  <div class="mt-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
    <!-- Waiting state -->
    <div v-if="status === 'pending'" class="p-5 flex flex-col items-center gap-3 text-center">
      <div class="relative w-16 h-16">
        <!-- Spinning ring -->
        <svg class="w-16 h-16 animate-spin" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="#e5e7eb" stroke-width="4" />
          <path
            d="M32 4 a28 28 0 0 1 28 28"
            stroke="#10b981"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
        <!-- Phone icon in center -->
        <div class="absolute inset-0 flex items-center justify-center">
          <DevicePhoneMobileIcon class="w-7 h-7 text-emerald-600" />
        </div>
      </div>
      <div>
        <p class="font-bold text-gray-900 dark:text-white text-base">
          {{ $t('payment.mpesa_prompt') }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ $t('payment.mpesa_instructions', { phone: displayPhone }) }}
        </p>
      </div>
      <div
        class="text-xs font-medium px-3 py-1.5 rounded-full animate-pulse"
        :style="{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }"
      >
        {{ $t('payment.mpesa_waiting') }}
      </div>
    </div>

    <!-- Success state -->
    <div v-else-if="status === 'paid'" class="p-5 flex flex-col items-center gap-3 text-center">
      <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-bounce-in">
        <CheckCircleIcon class="w-10 h-10 text-emerald-600" />
      </div>
      <p class="font-bold text-gray-900 dark:text-white">
        {{ $t('payment.mpesa_success') }}
      </p>
    </div>

    <!-- Failed state -->
    <div v-else-if="status === 'failed'" class="p-5 flex flex-col items-center gap-3 text-center">
      <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <XCircleIcon class="w-10 h-10 text-red-500" />
      </div>
      <p class="font-bold text-gray-900 dark:text-white">
        {{ $t('payment.mpesa_failed') }}
      </p>
      <button
        class="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-all active:scale-95"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click="$emit('retry')"
      >
        {{ $t('payment.retry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DevicePhoneMobileIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import { displayPhone as formatDisplayPhone } from '@qesuite/shared'

const props = defineProps<{
  status: 'idle' | 'pending' | 'paid' | 'failed'
  phone: string
}>()

defineEmits<{ retry: [] }>()

const displayPhone = computed(() => formatDisplayPhone(props.phone) || props.phone)
</script>
