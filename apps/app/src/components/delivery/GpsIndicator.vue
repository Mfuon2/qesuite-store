<template>
  <div class="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
    <!-- Dot -->
    <span
      class="w-2.5 h-2.5 rounded-full flex-shrink-0"
      :class="isActive ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-400'"
    ></span>
    <span class="text-xs font-semibold text-gray-600 select-none">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isActive: boolean
  lastUpdate: Date | null
}>()

const label = computed(() => {
  if (!props.isActive) return 'No GPS'
  if (!props.lastUpdate) return 'GPS'
  const diffSeconds = Math.round((Date.now() - props.lastUpdate.getTime()) / 1000)
  if (diffSeconds < 10) return 'GPS ✓'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  return `${Math.floor(diffSeconds / 60)}m ago`
})
</script>
