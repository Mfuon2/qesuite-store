<template>
  <div class="min-h-screen bg-gray-50 flex flex-col safe-top">
    <!-- Header -->
    <header class="bg-white shadow-sm px-4 pt-4 pb-3 sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <button
          class="tap-target flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
          @click="router.back()"
        >
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-900">Order Details</h1>
      </div>
    </header>

    <!-- Not found -->
    <div v-if="!assignment" class="flex-1 flex items-center justify-center p-6 text-center">
      <div>
        <p class="text-xl font-bold text-gray-800 mb-2">Order not found</p>
        <button class="btn-action-green mt-4" @click="router.back()">Go back</button>
      </div>
    </div>

    <template v-else>
      <main class="flex-1 px-4 py-3 space-y-3 overflow-y-auto pb-32">
        <!-- Order ID badge -->
        <div class="bg-emerald-500 rounded-2xl px-4 py-3 text-white text-center">
          <p class="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-0.5">Order</p>
          <p class="text-2xl font-black tracking-wider">
            #{{ assignment.tracking_code ?? assignment.order_id.slice(-6).toUpperCase() }}
          </p>
          <div class="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" :class="statusBadgeClass">
            {{ statusLabel }}
          </div>
        </div>

        <!-- Customer section -->
        <div class="bg-white rounded-2xl px-4 py-3 shadow-sm space-y-2.5">
          <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</h2>
          <p class="text-lg font-bold text-gray-900">{{ assignment.customer_name ?? 'Customer' }}</p>
          <a
            :href="`tel:${assignment.customer_phone}`"
            class="flex items-center justify-center gap-2.5 w-full py-4 bg-emerald-500 active:bg-emerald-600 rounded-xl text-white text-base font-bold shadow-md transition-all active:scale-95"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ assignment.customer_phone }}
          </a>
        </div>

        <!-- Delivery address -->
        <div class="bg-white rounded-2xl px-4 py-3 shadow-sm">
          <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Deliver to</h2>
          <p class="text-base font-bold text-gray-900 leading-snug mb-2.5">
            {{ assignment.delivery_address ?? 'No address provided' }}
          </p>
          <a
            :href="navigateUrl"
            target="_blank"
            rel="noopener"
            class="flex items-center justify-center gap-2.5 w-full py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white text-base font-bold shadow-sm transition-all active:scale-95"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            NAVIGATE
          </a>
        </div>

        <!-- Total -->
        <div class="bg-white rounded-2xl px-4 py-3 shadow-sm flex justify-between items-center">
          <span class="font-bold text-gray-700">Total</span>
          <span class="text-xl font-black text-gray-900">KES {{ assignment.total.toLocaleString() }}</span>
        </div>
      </main>

      <!-- Sticky action buttons -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom space-y-3">
        <button
          v-if="assignment.assignment_status === 'ASSIGNED'"
          class="btn-action-green flex items-center justify-center gap-3"
          :disabled="actionLoading"
          @click="handlePickedUp"
        >
          <span>PICKED UP ✓</span>
        </button>

        <button
          v-else-if="assignment.assignment_status === 'PICKED_UP' || assignment.assignment_status === 'ON_THE_WAY'"
          class="btn-action-green flex items-center justify-center gap-3"
          :disabled="actionLoading"
          @click="handleDelivered"
        >
          <span>DELIVERED ✓</span>
        </button>

        <div v-else-if="assignment.assignment_status === 'DELIVERED'" class="text-center py-3">
          <span class="text-emerald-600 font-bold text-lg">Delivery complete!</span>
        </div>
        <div v-else-if="assignment.assignment_status === 'FAILED'" class="text-center py-3">
          <span class="text-red-500 font-bold text-lg">Delivery failed</span>
          <p v-if="assignment.notes" class="text-gray-500 text-sm mt-1">{{ assignment.notes }}</p>
        </div>

        <button
          v-if="['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(assignment.assignment_status)"
          class="w-full py-4 text-base font-bold rounded-2xl text-red-600 bg-red-50 border-2 border-red-200 active:bg-red-100 transition-all active:scale-95"
          :disabled="actionLoading"
          @click="showFailureModal = true"
        >
          CANNOT DELIVER ✗
        </button>
      </div>
    </template>

    <FailureReasonModal
      v-if="showFailureModal"
      @confirm="handleFailed"
      @cancel="showFailureModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/deliveryOrders'
import FailureReasonModal from '@/components/delivery/FailureReasonModal.vue'
import type { AssignedOrder } from '@/api/delivery'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()

const assignmentId = route.params.id as string
const assignment = computed<AssignedOrder | undefined>(
  () => ordersStore.getOrderById(assignmentId)
)

const showFailureModal = ref(false)
const actionLoading = ref(false)

const navigateUrl = computed(() => {
  const a = assignment.value
  if (!a) return '#'
  if (a.delivery_lat != null && a.delivery_lng != null) {
    return `https://maps.google.com/?q=${a.delivery_lat},${a.delivery_lng}`
  }
  if (a.delivery_address) return `https://maps.google.com/?q=${encodeURIComponent(a.delivery_address)}`
  return '#'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    ASSIGNED: 'Assigned', PICKED_UP: 'Picked Up', ON_THE_WAY: 'On the Way',
    DELIVERED: 'Delivered', FAILED: 'Failed',
  }
  const s = assignment.value?.assignment_status ?? ''
  return map[s] ?? s
})

const statusBadgeClass = computed(() => {
  const s = assignment.value?.assignment_status
  if (s === 'DELIVERED') return 'bg-emerald-700 text-white'
  if (s === 'FAILED') return 'bg-red-100 text-red-700'
  if (s === 'PICKED_UP' || s === 'ON_THE_WAY') return 'bg-blue-100 text-blue-800'
  return 'bg-white/30 text-white'
})

async function handlePickedUp() {
  actionLoading.value = true
  try { await ordersStore.updateStatus(assignmentId, 'PICKED_UP') }
  finally { actionLoading.value = false }
}

async function handleDelivered() {
  actionLoading.value = true
  try { await ordersStore.updateStatus(assignmentId, 'DELIVERED') }
  finally { actionLoading.value = false }
}

async function handleFailed(reason: string) {
  showFailureModal.value = false
  actionLoading.value = true
  try { await ordersStore.updateStatus(assignmentId, 'FAILED', reason) }
  finally { actionLoading.value = false }
}
</script>
