<template>
  <div class="flex items-start gap-2">
    <template v-for="(step, i) in steps" :key="i">
      <div class="flex min-w-0 items-start gap-2">
        <div
          :class="[
            'grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-sm font-extrabold transition-all duration-300',
            currentStep > i + 1 ? 'bg-emerald-700 text-white shadow-[0_10px_22px_rgba(20,132,71,0.22)]' :
            currentStep === i + 1 ? 'bg-emerald-700 text-white shadow-[0_10px_22px_rgba(20,132,71,0.22)] ring-4 ring-emerald-100' :
            'bg-slate-100 text-slate-400'
          ]"
        >
          <CheckIcon v-if="currentStep > i + 1" class="h-5 w-5" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="hidden min-w-0 sm:block">
          <p :class="['truncate text-sm font-extrabold', currentStep === i + 1 ? 'text-slate-950' : 'text-slate-400']">
            {{ step }}
          </p>
          <p :class="['text-xs font-medium', currentStep === i + 1 ? 'text-slate-500' : 'text-slate-300']">
            Step {{ i + 1 }}
          </p>
        </div>
      </div>
      <div v-if="i < steps.length - 1" :class="['mt-4 h-0.5 min-w-6 flex-1 rounded-full transition-all duration-300', currentStep > i + 1 ? 'bg-emerald-600' : 'bg-slate-200']" />
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
