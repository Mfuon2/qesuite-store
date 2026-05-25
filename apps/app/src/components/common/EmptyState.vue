<template>
  <div :class="['flex flex-col items-center justify-center text-center', sizeClass]">
    <svg
      class="text-slate-600 mb-3"
      :class="iconSizeClass"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="iconPath" />
    </svg>
    <p class="text-slate-400 text-sm font-medium">{{ message }}</p>
    <p v-if="subtext" class="text-slate-500 text-xs mt-1">{{ subtext }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Main empty-state message */
  message?: string
  /** Optional secondary line */
  subtext?: string
  /**
   * Preset icon name. Extend as needed.
   * 'store' | 'billing' | 'orders' | 'search' | 'default'
   */
  icon?: 'store' | 'billing' | 'orders' | 'search' | 'default'
  size?: 'sm' | 'md' | 'lg'
}>(), {
  message: 'No results found',
  icon: 'default',
  size: 'md',
})

const ICONS: Record<string, string> = {
  store:   'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M19 21h2M5 21h-2',
  billing: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  orders:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  default: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
}

const iconPath = computed(() => ICONS[props.icon] ?? ICONS.default)

const sizeClass = computed(() => ({
  sm: 'py-8',
  md: 'py-14',
  lg: 'py-20',
}[props.size]))

const iconSizeClass = computed(() => ({
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}[props.size]))
</script>
