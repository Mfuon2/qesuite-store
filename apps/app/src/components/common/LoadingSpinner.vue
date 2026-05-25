<template>
  <div :class="['flex items-center justify-center', heightClass]">
    <svg
      :class="['animate-spin text-slate-500', sizeClass]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  /** Optional fixed height wrapper. Pass 'none' to suppress the wrapper. */
  height?: 'sm' | 'md' | 'lg' | 'none'
}>(), {
  size: 'md',
  height: 'md',
})

const sizeClass = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
}[props.size]))

const heightClass = computed(() => ({
  sm:   'h-24',
  md:   'h-44',
  lg:   'h-64',
  none: '',
}[props.height]))
</script>
