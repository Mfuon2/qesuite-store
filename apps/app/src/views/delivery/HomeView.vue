<template>
  <div class="min-h-screen bg-gray-50 flex flex-col safe-top">
    <!-- Header -->
    <header class="bg-white shadow-sm px-4 pt-3 pb-2.5 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500 font-medium">Good to go,</p>
          <h1 class="text-lg font-black text-gray-900">{{ auth.user?.name ?? 'Rider' }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <GpsIndicator :is-active="geo.isActive.value" :last-update="geo.lastUpdate.value" />
          <button
            class="tap-target flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
            @click="handleLogout"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Pull to refresh / Refresh button -->
    <div class="px-4 py-2">
      <button
        class="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm active:bg-gray-50 transition-colors tap-target"
        :disabled="ordersStore.loading"
        @click="refresh"
      >
        <svg
          class="w-5 h-5"
          :class="{ spinning: ordersStore.loading }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ ordersStore.loading ? 'Refreshing...' : 'Refresh deliveries' }}
      </button>
    </div>

    <!-- Error state -->
    <div v-if="ordersStore.error && !ordersStore.loading" class="mx-4 mb-3 bg-red-50 border border-red-200 rounded-2xl p-4">
      <p class="text-red-700 font-semibold text-center">{{ ordersStore.error }}</p>
    </div>

    <!-- Order list -->
    <main class="flex-1 px-4 pb-6 space-y-3 overflow-y-auto">
      <!-- Empty state -->
      <div v-if="!ordersStore.loading && ordersStore.sortedOrders.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-gray-800 mb-1">All clear!</h2>
        <p class="text-gray-500 text-sm">No deliveries assigned yet.</p>
      </div>

      <!-- Skeleton loading -->
      <template v-else-if="ordersStore.loading && ordersStore.sortedOrders.length === 0">
        <div v-for="i in 3" :key="i" class="bg-white rounded-3xl p-5 shadow-sm animate-pulse">
          <div class="h-5 bg-gray-200 rounded-full w-1/3 mb-3"></div>
          <div class="h-7 bg-gray-200 rounded-full w-2/3 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded-full w-full mb-4"></div>
          <div class="h-12 bg-gray-200 rounded-2xl w-full"></div>
        </div>
      </template>

      <!-- Order cards -->
      <OrderCard
        v-for="order in ordersStore.sortedOrders"
        :key="order.order_id"
        :assignment="order"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/deliveryOrders'
import { useGeolocation } from '@/composables/useGeolocation'
import OrderCard from '@/components/delivery/OrderCard.vue'
import GpsIndicator from '@/components/delivery/GpsIndicator.vue'

const auth = useAuthStore()
const ordersStore = useOrdersStore()
const router = useRouter()
const geo = useGeolocation()

onMounted(async () => {
  await ordersStore.fetchOrders()
})

async function refresh() {
  await ordersStore.fetchOrders()
}

async function handleLogout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>
