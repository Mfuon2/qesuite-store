<template>
  <div class="flex items-center gap-2">
    <template v-for="(step, i) in steps" :key="i">
      <div class="flex items-center gap-2">
        <div
          :class="[
            'flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300',
            currentStep > i + 1 ? 'bg-primary text-white' :
            currentStep === i + 1 ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/20' :
            'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          ]"
        >
          <CheckIcon v-if="currentStep > i + 1" class="w-5 h-5" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span :class="['text-sm font-medium hidden sm:block', currentStep === i + 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500']">
          {{ step }}
        </span>
      </div>
      <div v-if="i < steps.length - 1" :class="['flex-1 h-0.5 rounded-full transition-all duration-300', currentStep > i + 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700']" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'

defineProps<{
  currentStep: number
  steps: string[]
}>()
</script>
