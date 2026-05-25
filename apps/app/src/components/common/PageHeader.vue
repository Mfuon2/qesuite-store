<template>
  <div class="flex items-center justify-between mb-4">
    <div>
      <h1 :class="titleClass">{{ title }}</h1>
      <p v-if="subtitle" class="text-slate-400 text-xs mt-0.5">{{ subtitle }}</p>
    </div>
    <!-- Optional right-side slot for buttons / controls -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const titleClass = computed(() => ({
  sm: 'text-base font-bold text-white',
  md: 'text-lg font-bold text-white',
  lg: 'text-2xl font-bold text-white',
}[props.size]))
</script>
