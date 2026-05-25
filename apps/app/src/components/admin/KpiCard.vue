<template>
  <div class="admin-card p-3.5">
    <div class="flex items-start justify-between mb-2">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ label }}</p>
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        :class="iconBgClass"
      >
        <!-- stores -->
        <svg v-if="icon === 'stores'" class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
        </svg>
        <!-- trial -->
        <svg v-else-if="icon === 'trial'" class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <!-- warning -->
        <svg v-else-if="icon === 'warning'" class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <!-- money -->
        <svg v-else-if="icon === 'money'" class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <!-- chart -->
        <svg v-else-if="icon === 'chart'" class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <!-- funnel -->
        <svg v-else class="w-4 h-4" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </div>
    </div>

    <div v-if="loading" class="space-y-1.5">
      <div class="h-6 w-24 bg-slate-700 rounded animate-pulse"></div>
      <div class="h-2.5 w-16 bg-slate-700/60 rounded animate-pulse"></div>
    </div>
    <template v-else>
      <p class="text-xl font-bold text-white mb-0.5">{{ value }}</p>
      <p class="text-xs text-slate-500">{{ sub }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string
  sub?: string
  icon?: string
  color?: string
  loading?: boolean
}>()

const iconBgClass = computed(() => {
  const map: Record<string, string> = {
    indigo: 'bg-indigo-500/20',
    amber: 'bg-amber-500/20',
    red: 'bg-red-500/20',
    emerald: 'bg-emerald-500/20',
    blue: 'bg-blue-500/20',
    violet: 'bg-violet-500/20',
  }
  return map[props.color ?? 'indigo'] ?? 'bg-indigo-500/20'
})

const iconColorClass = computed(() => {
  const map: Record<string, string> = {
    indigo: 'text-indigo-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
  }
  return map[props.color ?? 'indigo'] ?? 'text-indigo-400'
})
</script>
