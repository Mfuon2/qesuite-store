<template>
  <div class="admin-card admin-card-hover p-4">
    <div class="mb-3 flex items-start justify-between gap-3">
      <p class="text-[11px] font-black uppercase tracking-wider text-slate-500">{{ label }}</p>
      <div
        class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ring-1"
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
      <div class="h-6 w-24 animate-pulse rounded bg-slate-200"></div>
      <div class="h-2.5 w-16 animate-pulse rounded bg-slate-100"></div>
    </div>
    <template v-else>
      <p class="mb-0.5 text-2xl font-black tracking-tight text-slate-950">{{ value }}</p>
      <p class="text-xs font-medium text-slate-500">{{ sub }}</p>
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
    indigo: 'bg-emerald-50 ring-emerald-100',
    amber: 'bg-amber-50 ring-amber-100',
    red: 'bg-red-50 ring-red-100',
    emerald: 'bg-emerald-50 ring-emerald-100',
    blue: 'bg-blue-50 ring-blue-100',
    violet: 'bg-violet-50 ring-violet-100',
  }
  return map[props.color ?? 'indigo'] ?? 'bg-emerald-50 ring-emerald-100'
})

const iconColorClass = computed(() => {
  const map: Record<string, string> = {
    indigo: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    violet: 'text-violet-700',
  }
  return map[props.color ?? 'indigo'] ?? 'text-emerald-700'
})
</script>
