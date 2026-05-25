<template>
  <div class="bg-white rounded-3xl shadow-sm overflow-hidden">
    <div class="p-5">
      <!-- Top row: Order ID + Status badge -->
      <div class="flex items-center justify-between mb-3">
        <p class="text-2xl font-black text-gray-900 tracking-wide">
          #{{ assignment.tracking_code ?? assignment.order_id.slice(-6).toUpperCase() }}
        </p>
        <span class="px-3 py-1 rounded-full text-xs font-bold" :class="badgeClass">
          {{ statusLabel }}
        </span>
      </div>

      <!-- Customer name -->
      <p class="text-lg font-bold text-gray-800 mb-1">
        {{ assignment.customer_name ?? 'Customer' }}
      </p>

      <!-- Address -->
      <p class="text-gray-500 text-sm leading-snug line-clamp-2 mb-3">
        <svg class="inline w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {{ assignment.delivery_address ?? 'No address' }}
      </p>

      <!-- Distance -->
      <p v-if="assignment.distanceKm != null" class="text-xs font-semibold text-emerald-600 mb-3">
        ~{{ assignment.distanceKm.toFixed(1) }} km away
      </p>

      <!-- View details button -->
      <RouterLink
        :to="{ name: 'rider-order', params: { id: assignment.order_id } }"
        class="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white font-bold text-base rounded-2xl active:bg-gray-800 transition-colors tap-target"
      >
        View Details
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { AssignmentWithDistance } from '@/stores/deliveryOrders'

const props = defineProps<{
  assignment: AssignmentWithDistance
}>()

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    ASSIGNED: 'Assigned',
    PICKED_UP: 'Picked Up',
    ON_THE_WAY: 'On the Way',
    DELIVERED: 'Delivered',
    FAILED: 'Failed',
  }
  return map[props.assignment.assignment_status] ?? props.assignment.assignment_status
})

const badgeClass = computed(() => {
  const s = props.assignment.assignment_status
  if (s === 'DELIVERED') return 'bg-emerald-100 text-emerald-700'
  if (s === 'FAILED') return 'bg-red-100 text-red-700'
  if (s === 'PICKED_UP' || s === 'ON_THE_WAY') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-700'
})
</script>
