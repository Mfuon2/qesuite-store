<template>
  <div
    :class="[
      'cursor-pointer group',
      viewMode === 'kanban' ? 'owner-card p-3' : 'owner-list-row flex items-center gap-3'
    ]"
    @click="emit('view-detail', order)"
  >
    <template v-if="viewMode === 'kanban'">
      <!-- Kanban card -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <div>
          <p class="text-xs font-mono font-semibold text-slate-400">#{{ order.tracking_code }}</p>
          <p class="mt-0.5 text-sm font-bold text-slate-950">{{ order.customer_name || 'Customer' }}</p>
        </div>
        <StatusBadge :status="order.status" size="xs" />
      </div>

      <div class="space-y-0.5 mb-2">
        <p class="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CubeIcon class="w-3.5 h-3.5 shrink-0" />
          {{ itemsSummary }}
        </p>
        <p class="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CreditCardIcon class="w-3.5 h-3.5 shrink-0" />
          {{ paymentMethodLabel }}
          <span :class="['px-1.5 py-0.5 rounded-full font-bold', order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500']">
            {{ order.payment_status }}
          </span>
        </p>
        <p class="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <ClockIcon class="w-3.5 h-3.5 shrink-0" />
          {{ timeAgo }}
        </p>
      </div>

      <div class="flex items-center justify-between">
        <span class="font-bold text-primary text-sm">KES {{ order.total.toLocaleString() }}</span>
        <div class="flex gap-1">
          <a
            :href="`tel:${order.customer_phone}`"
            @click.stop
            class="owner-action-icon"
            title="Call customer"
          >
            <PhoneIcon class="w-3.5 h-3.5" />
          </a>
          <button
            v-if="allowStatusUpdates"
            v-for="action in availableActions"
            :key="action.status"
            @click.stop="handleStatusChange(action.status)"
            :class="['px-2 py-1 text-xs font-medium rounded-lg transition-colors', action.class]"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- List/table row -->
      <div class="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
        <div class="min-w-0">
          <p class="text-xs font-mono font-semibold text-slate-400">#{{ order.tracking_code }}</p>
          <p class="truncate text-sm font-bold text-slate-950">{{ order.customer_name || 'Customer' }}</p>
        </div>
        <div class="hidden sm:block">
          <p class="truncate text-xs font-medium text-slate-500">{{ itemsSummary }}</p>
          <p class="text-xs font-medium text-slate-400">{{ timeAgo }}</p>
        </div>
        <div class="flex items-center gap-2">
          <StatusBadge :status="order.status" size="xs" />
        </div>
        <div class="flex items-center justify-end gap-2">
          <span class="font-bold text-primary text-sm whitespace-nowrap">KES {{ order.total.toLocaleString() }}</span>
          <a
            :href="`tel:${order.customer_phone}`"
            @click.stop
            class="owner-action-icon"
          >
            <PhoneIcon class="w-4 h-4" />
          </a>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhoneIcon, CubeIcon, CreditCardIcon, ClockIcon } from '@heroicons/vue/24/outline'
import StatusBadge from './StatusBadge.vue'
import type { Order, OrderStatus } from '@qesuite/types'
import { parseAppTimestamp } from '@qesuite/shared'

const props = defineProps<{
  order: Order
  viewMode: 'kanban' | 'list'
  allowStatusUpdates?: boolean
}>()

const emit = defineEmits<{
  'status-changed': [orderId: string, status: OrderStatus]
  'view-detail': [order: Order]
}>()

const itemsSummary = computed(() => {
  if (!props.order.items?.length) return 'No items'
  const count = props.order.items.reduce((sum, i) => sum + i.quantity, 0)
  return `${count} item${count !== 1 ? 's' : ''}`
})

const paymentMethodLabel = computed(() => {
  const m = props.order.payment_method
  if (m === 'pay_on_delivery') return 'Pay on delivery'
  if (m === 'mpesa') return 'M-Pesa'
  if (m === 'stripe') return 'Card'
  return m || 'Unknown'
})

const timeAgo = computed(() => {
  const diff = Date.now() - parseAppTimestamp(props.order.created_at).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
})

const statusActions: Record<OrderStatus, { status: OrderStatus; label: string; class: string }[]> = {
  NEW: [{ status: 'CONFIRMED', label: 'Accept', class: 'bg-primary text-white hover:brightness-105' }, { status: 'CANCELLED', label: 'Cancel', class: 'bg-red-100 text-red-600 hover:bg-red-200' }],
  CONFIRMED: [{ status: 'PREPARING', label: 'Prepare', class: 'bg-amber-500 text-white hover:bg-amber-600' }],
  PREPARING: [{ status: 'READY', label: 'Ready', class: 'bg-primary text-white hover:brightness-105' }],
  READY: [{ status: 'OUT_FOR_DELIVERY', label: 'Dispatch', class: 'bg-teal-500 text-white hover:bg-teal-600' }],
  OUT_FOR_DELIVERY: [{ status: 'DELIVERED', label: 'Delivered', class: 'bg-green-500 text-white hover:bg-green-600' }],
  DELIVERED: [],
  CANCELLED: []
}

const availableActions = computed(() => statusActions[props.order.status] || [])

function handleStatusChange(status: OrderStatus) {
  emit('status-changed', props.order.id, status)
}
</script>
