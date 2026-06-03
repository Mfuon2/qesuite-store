<template>
  <span :class="['inline-flex items-center font-semibold rounded-full', sizeClass, colorClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '@qesuite/types'

const props = withDefaults(defineProps<{
  status: OrderStatus | string
  size?: 'xs' | 'sm' | 'md'
}>(), { size: 'sm' })

const statusConfig: Record<string, { label: string; class: string }> = {
  NEW: { label: 'New', class: 'bg-blue-100 text-blue-700  ' },
  CONFIRMED: { label: 'Confirmed', class: 'bg-indigo-100 text-indigo-700  ' },
  PREPARING: { label: 'Preparing', class: 'bg-amber-100 text-amber-700  ' },
  READY: { label: 'Ready', class: 'bg-emerald-100 text-emerald-700  ' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', class: 'bg-teal-100 text-teal-700  ' },
  DELIVERED: { label: 'Delivered', class: 'bg-green-100 text-green-700  ' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-100 text-red-700  ' },
  // Payment statuses
  pending: { label: 'Pending', class: 'bg-gray-100 text-gray-600  ' },
  paid: { label: 'Paid', class: 'bg-green-100 text-green-700  ' },
  failed: { label: 'Failed', class: 'bg-red-100 text-red-700  ' },
}

const label = computed(() => statusConfig[props.status]?.label || props.status)
const colorClass = computed(() => statusConfig[props.status]?.class || 'bg-gray-100 text-gray-600')
const sizeClass = computed(() => ({
  xs: 'px-2 py-0.5 text-xs gap-1',
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-sm gap-2'
}[props.size]))
</script>
