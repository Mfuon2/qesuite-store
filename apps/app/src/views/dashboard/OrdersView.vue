<template>
  <div class="owner-page">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <div class="owner-eyebrow">
            Live orders
            <RealTimeIndicator :status="realtimeStatus" />
          </div>
          <h1 class="owner-title">Orders</h1>
          <p class="owner-subtitle">
            Track every customer request from new order to delivery, with the fastest actions kept close to the workflow.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="settingsStore.toggleSound()"
            :class="['owner-icon-button', settingsStore.soundEnabled ? 'owner-brand-selected text-primary' : '']"
            :title="settingsStore.soundEnabled ? 'Mute order sounds' : 'Enable order sounds'"
          >
            <SpeakerWaveIcon v-if="settingsStore.soundEnabled" class="h-5 w-5" />
            <SpeakerXMarkIcon v-else class="h-5 w-5" />
          </button>
          <div class="owner-segmented">
            <button
              @click="settingsStore.setOrderView('kanban')"
              :class="['owner-segment-button', settingsStore.orderView === 'kanban' ? 'owner-segment-button-active' : '']"
              title="Kanban view"
            >
              <ViewColumnsIcon class="h-4 w-4" />
            </button>
            <button
              @click="settingsStore.setOrderView('list')"
              :class="['owner-segment-button', settingsStore.orderView === 'list' ? 'owner-segment-button-active' : '']"
              title="List view"
            >
              <ListBulletIcon class="h-4 w-4" />
            </button>
          </div>
          <button @click="ordersStore.fetchOrders()" class="owner-icon-button" title="Refresh orders">
            <ArrowPathIcon :class="['h-5 w-5', ordersStore.loading ? 'animate-spin' : '']" />
          </button>
        </div>
      </div>
    </section>

    <section class="owner-stat-grid">
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <ShoppingCartIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ tabCounts.ALL || 0 }}</p>
          <p class="text-xs font-medium text-slate-500">Total orders</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-sky-50 text-sky-700 ring-sky-100">
          <ViewColumnsIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ tabCounts.NEW || 0 }}</p>
          <p class="text-xs font-medium text-slate-500">New</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-amber-50 text-amber-700 ring-amber-100">
          <ArrowPathIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ tabCounts.PREPARING || 0 }}</p>
          <p class="text-xs font-medium text-slate-500">Preparing</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <ListBulletIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ tabCounts.DELIVERED || 0 }}</p>
          <p class="text-xs font-medium text-slate-500">Delivered</p>
        </div>
      </div>
    </section>

    <div class="owner-filter-bar">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        @click="setFilter(tab.value)"
        :class="[
          'owner-filter-pill',
          activeFilter === tab.value ? 'owner-filter-pill-active' : ''
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tabCounts[tab.value] > 0"
          :class="['rounded-full px-1.5 py-0.5 text-[10px] font-black', activeFilter === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500']"
        >
          {{ tabCounts[tab.value] }}
        </span>
      </button>
    </div>

    <div class="mt-5">
      <div v-if="ordersStore.loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="i in 8" :key="i" class="skeleton h-40 rounded-[24px]" />
      </div>

      <div v-else-if="filteredOrders.length === 0" class="owner-empty">
        <ShoppingCartIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No orders yet</p>
        <p class="mt-1 text-sm text-slate-500">Orders will appear here when customers place them.</p>
      </div>

      <template v-else-if="settingsStore.orderView === 'kanban'">
        <div v-if="activeFilter === 'ALL'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="col in kanbanColumns"
            :key="col.status"
            class="owner-panel min-w-0 p-3 sm:p-3"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <span :class="['h-2.5 w-2.5 shrink-0 rounded-full', col.dot]" />
                <h3 class="truncate text-sm font-bold text-slate-800">{{ col.label }}</h3>
              </div>
              <span class="rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">{{ ordersByStatus[col.status]?.length || 0 }}</span>
            </div>
            <div class="min-h-[90px] space-y-2">
              <OrderCard
                v-for="order in ordersByStatus[col.status] || []"
                :key="order.id"
                :order="order"
                view-mode="kanban"
                @status-changed="handleStatusChange"
                @view-detail="goToDetail"
              />
              <div v-if="!ordersByStatus[col.status]?.length" class="flex h-20 items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/60">
                <p class="text-xs font-semibold text-slate-400">No orders</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <template v-else>
        <div class="owner-panel space-y-2 p-2 sm:p-2">
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
