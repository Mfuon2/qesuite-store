<template>
  <div class="flex items-center justify-center px-4 py-4">
    <div class="flex items-center gap-0">
      <template v-for="(step, i) in steps" :key="step.key">
        <!-- Step circle -->
        <button
          class="flex flex-col items-center gap-1 group"
          :disabled="i + 1 > currentStep"
          @click="i + 1 < currentStep && $emit('go-to-step', i + 1)"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
            :class="getStepClass(i + 1)"
          >
            <CheckIcon v-if="i + 1 < currentStep" class="w-4 h-4" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span
            class="text-xs font-medium hidden sm:block transition-colors"
            :class="i + 1 <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'"
          >
            {{ step.label }}
          </span>
        </button>

        <!-- Connector line -->
        <div
          v-if="i < steps.length - 1"
          class="w-12 sm:w-16 h-0.5 mb-5 sm:mb-6 mx-1 transition-colors duration-300"
          :class="i + 1 < currentStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/solid'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ currentStep: number }>()
defineEmits<{ 'go-to-step': [step: number] }>()
const { t } = useI18n()

const steps = computed(() => [
  { key: 'contact', label: t('checkout.steps.contact') },
  { key: 'delivery', label: t('checkout.steps.delivery') },
  { key: 'payment', label: t('checkout.steps.payment') },
  { key: 'confirm', label: t('checkout.steps.confirm') },
])

function getStepClass(step: number) {
  if (step < props.currentStep) {
    return 'text-white'
  }
  if (step === props.currentStep) {
    return 'text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
  }
  return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
}
</script>

<style scoped>
button:not([disabled]) div {
  background-color: var(--color-primary);
}
button[disabled] div:not(.completed) {
  background-color: inherit;
}
/* Active step ring uses primary color */
div[class*="ring-2"] {
  ring-color: var(--color-primary);
}
</style>
