<template>
  <div class="bg-white  rounded-xl border border-gray-100  p-3.5 shadow-sm hover:shadow-md transition-shadow">
    <div v-if="loading" class="space-y-2">
      <div class="skeleton h-3 w-20 rounded" />
      <div class="skeleton h-6 w-28 rounded" />
      <div class="skeleton h-3 w-16 rounded" />
    </div>
    <template v-else>
      <div class="flex items-start justify-between gap-2 mb-1.5">
        <p class="text-xs font-medium text-gray-500  leading-tight">{{ title }}</p>
        <div v-if="icon" class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <component :is="icon" class="w-4 h-4 text-primary" />
        </div>
      </div>
      <p class="text-xl font-bold text-gray-900  mb-1 tabular-nums">{{ value }}</p>
      <div v-if="change !== undefined" class="flex items-center gap-1">
        <div :class="['flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold', changeClass]">
          <ArrowTrendingUpIcon v-if="change >= 0" class="w-3 h-3" />
          <ArrowTrendingDownIcon v-else class="w-3 h-3" />
          {{ Math.abs(change).toFixed(1) }}%
        </div>
        <span class="text-xs text-gray-400 ">vs prior</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  title: string
  value?: string | number
  change?: number
  icon?: Component
  loading?: boolean
}>()

const changeClass = computed(() => {
  if (props.change === undefined) return ''
  return props.change >= 0
    ? 'bg-emerald-50 text-emerald-700  '
    : 'bg-red-50 text-red-600  '
})
</script>
