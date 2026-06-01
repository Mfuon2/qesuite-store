<template>
  <div class="px-1 py-1">
    <div class="flex w-full items-start">
      <template v-for="(step, i) in steps" :key="step.key">
        <!-- Step circle -->
        <button
          class="group flex shrink-0 flex-col items-center gap-1"
          :disabled="i + 1 > currentStep"
          @click="i + 1 < currentStep && $emit('go-to-step', i + 1)"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-200"
            :class="getStepClass(i + 1)"
          >
            <CheckIcon v-if="i + 1 < currentStep" class="w-4 h-4" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span
            class="hidden text-xs font-bold transition-colors sm:block"
            :class="i + 1 <= currentStep ? 'text-slate-950' : 'text-slate-400'"
          >
            {{ step.label }}
          </span>
        </button>

        <!-- Connector line -->
        <div
          v-if="i < steps.length - 1"
          class="mx-2 mt-[1.125rem] h-0.5 min-w-8 flex-1 transition-colors duration-300 sm:mx-3"
          :class="i + 1 < currentStep ? 'bg-emerald-500' : 'bg-slate-100'"
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
    return 'text-white ring-2 ring-emerald-200 ring-offset-2 ring-offset-white'
  }
  return 'bg-slate-100 text-slate-400'
}
</script>

<style scoped>
button:not([disabled]) div {
  background-color: var(--color-primary);
}
</style>
