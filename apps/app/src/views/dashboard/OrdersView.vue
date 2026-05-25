<template>
  <div class="p-3 sm:p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <h2 class="text-base font-bold text-gray-900 dark:text-white">Orders</h2>
        <RealTimeIndicator :status="realtimeStatus" />
      </div>
      <div class="flex items-center gap-2">
        <!-- Sound toggle -->
        <button
          @click="settingsStore.toggleSound()"
          :class="['p-2 rounded-xl transition-colors', settingsStore.soundEnabled ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100 dark:bg-gray-700']"
          :title="settingsStore.soundEnabled ? 'Mute order sounds' : 'Enable order sounds'"
        >
          <SpeakerWaveIcon v-if="settingsStore.soundEnabled" class="w-5 h-5" />
          <SpeakerXMarkIcon v-else class="w-5 h-5" />
        </button>
        <!-- View toggle -->
        <div class="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            @click="settingsStore.setOrderView('kanban')"
            :class="['p-2 transition-colors', settingsStore.orderView === 'kanban' ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700']"
          >
            <ViewColumnsIcon class="w-5 h-5" />
          </button>
          <button
            @click="settingsStore.setOrderView('list')"
            :class="['p-2 transition-colors', settingsStore.orderView === 'list' ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700']"
          >
            <ListBulletIcon class="w-5 h-5" />
          </button>
        </div>
        <button @click="ordersStore.fetchOrders()" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <ArrowPathIcon :class="['w-5 h-5', ordersStore.loading ? 'animate-spin' : '']" />
        </button>
      </div>
    </div>

    <!-- Status filter tabs -->
    <div class="flex gap-1 overflow-x-auto pb-1.5 mb-3 scrollbar-hide">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        @click="setFilter(tab.value)"
        :class="[
          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
          activeFilter === tab.value
            ? 'bg-primary text-white shadow-md shadow-primary/20'
            : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tabCounts[tab.value] > 0"
          :class="['text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center', activeFilter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300']"
        >
          {{ tabCounts[tab.value] }}
        </span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="ordersStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div v-for="i in 8" :key="i" class="skeleton h-36 rounded-xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredOrders.length === 0" class="text-center py-10 text-gray-400 dark:text-gray-500">
      <ShoppingCartIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No orders yet</p>
      <p class="text-xs mt-0.5">Orders will appear here when customers place them</p>
    </div>

    <!-- KANBAN VIEW -->
    <template v-else-if="settingsStore.orderView === 'kanban'">
      <div v-if="activeFilter === 'ALL'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-x-auto">
        <div
          v-for="col in kanbanColumns"
          :key="col.status"
          class="min-w-0"
        >
          <div class="flex items-center gap-1.5 mb-2">
            <span :class="['w-2 h-2 rounded-full shrink-0', col.dot]" />
            <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ col.label }}</h3>
            <span class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{{ ordersByStatus[col.status]?.length || 0 }}</span>
          </div>
          <div class="space-y-2 min-h-[80px]">
            <OrderCard
              v-for="order in ordersByStatus[col.status] || []"
              :key="order.id"
              :order="order"
              view-mode="kanban"
              @status-changed="handleStatusChange"
              @view-detail="goToDetail"
            />
            <div v-if="!ordersByStatus[col.status]?.length" class="border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl h-16 flex items-center justify-center">
              <p class="text-xs text-gray-300 dark:text-gray-600">No orders</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        <OrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          view-mode="kanban"
          @status-changed="handleStatusChange"
          @view-detail="goToDetail"
        />
      </div>
    </template>

    <!-- LIST VIEW -->
    <template v-else>
      <div class="space-y-1.5">
        <OrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          view-mode="list"
          @status-changed="handleStatusChange"
          @view-detail="goToDetail"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ViewColumnsIcon, ListBulletIcon, ArrowPathIcon,
  SpeakerWaveIcon, SpeakerXMarkIcon, ShoppingCartIcon
} from '@heroicons/vue/24/outline'
import OrderCard from '@/components/dashboard/OrderCard.vue'
import RealTimeIndicator from '@/components/dashboard/RealTimeIndicator.vue'
import { useOrdersStore } from '@/stores/orders'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useRealtime } from '@/composables/useRealtime'
import type { OrderStatus } from '@qesuite/types'

const router = useRouter()
const ordersStore = useOrdersStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const activeFilter = ref<OrderStatus | 'ALL'>('ALL')

const statusTabs = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

const kanbanColumns = [
  { status: 'NEW' as OrderStatus, label: 'New', dot: 'bg-blue-500' },
  { status: 'CONFIRMED' as OrderStatus, label: 'Confirmed', dot: 'bg-indigo-500' },
  { status: 'PREPARING' as OrderStatus, label: 'Preparing', dot: 'bg-amber-500' },
  { status: 'READY' as OrderStatus, label: 'Ready', dot: 'bg-emerald-500' },
]

const filteredOrders = computed(() => {
  if (activeFilter.value === 'ALL') return ordersStore.orders
  return ordersStore.orders.filter(o => o.status === activeFilter.value)
})

const ordersByStatus = computed(() => {
  const map: Record<string, typeof ordersStore.orders> = {}
  for (const o of ordersStore.orders) {
    if (!map[o.status]) map[o.status] = []
    map[o.status].push(o)
  }
  return map
})

const tabCounts = computed(() => {
  const counts: Record<string, number> = { ALL: ordersStore.orders.length }
  for (const o of ordersStore.orders) {
    counts[o.status] = (counts[o.status] || 0) + 1
  }
  return counts
})

// Realtime
const tenantId = authStore.user?.tenant_id || ''
const { status: realtimeStatus } = useRealtime(tenantId)

function setFilter(val: OrderStatus | 'ALL') {
  activeFilter.value = val
}

function handleStatusChange(orderId: string, status: OrderStatus) {
  ordersStore.updateOrderStatus(orderId, status)
}

function goToDetail(order: { id: string }) {
  router.push(`/orders/${order.id}`)
}

onMounted(() => ordersStore.fetchOrders())
</script>
