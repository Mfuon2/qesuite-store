<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shrink-0',
        'hidden lg:flex'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p class="font-bold text-gray-900 dark:text-white text-sm leading-tight">QeSuite</p>
          <p class="text-xs text-gray-400 truncate max-w-[130px]">{{ settingsStore.tenant?.name || 'Dashboard' }}</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
            $route.path.startsWith(item.to)
              ? 'bg-primary/10 text-primary'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          {{ item.label }}
          <span v-if="item.to === '/orders' && newOrderCount > 0"
            class="ml-auto flex items-center justify-center w-5 h-5 bg-primary text-white text-xs font-bold rounded-full">
            {{ newOrderCount > 99 ? '99+' : newOrderCount }}
          </span>
        </router-link>
      </nav>

      <!-- User -->
      <div class="border-t border-gray-100 dark:border-gray-700 p-3">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <span class="text-primary font-semibold text-sm">{{ userInitial }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ authStore.user?.name || 'Owner' }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email || authStore.user?.phone }}</p>
          </div>
          <button @click="handleLogout" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sign out">
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Trial banner -->
      <TrialBanner v-if="settingsStore.isTrialing && settingsStore.trialDaysLeft !== null" :days-left="settingsStore.trialDaysLeft" />

      <!-- Top bar (mobile header + desktop breadcrumb) -->
      <header class="flex items-center gap-4 px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <!-- Mobile menu trigger -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>

        <!-- Page title -->
        <h1 class="font-semibold text-gray-900 dark:text-white text-base flex-1 lg:hidden truncate">{{ currentPageTitle }}</h1>

        <div class="flex items-center gap-2 ml-auto">
          <!-- Dark mode -->
          <button @click="settingsStore.toggleDarkMode()" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MoonIcon v-if="!settingsStore.darkMode" class="w-5 h-5" />
            <SunIcon v-else class="w-5 h-5" />
          </button>
          <!-- Notifications bell -->
          <div class="relative">
            <button class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <BellIcon class="w-5 h-5" />
            </button>
            <span v-if="newOrderCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {{ newOrderCount > 9 ? '9+' : newOrderCount }}
            </span>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>

      <!-- Mobile bottom nav -->
      <nav class="lg:hidden flex items-center bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe shrink-0">
        <router-link
          v-for="item in mobileNavItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex-1 flex flex-col items-center gap-1 py-2 transition-colors relative',
            $route.path.startsWith(item.to) ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
          ]"
        >
          <div class="relative">
            <component :is="item.icon" class="w-5 h-5" />
            <span v-if="item.to === '/orders' && newOrderCount > 0"
              class="absolute -top-1 -right-1.5 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
              {{ newOrderCount > 9 ? '9+' : newOrderCount }}
            </span>
          </div>
          <span class="text-xs font-medium">{{ item.short }}</span>
        </router-link>
      </nav>
    </div>

    <!-- Mobile sidebar overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 flex lg:hidden">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="mobileMenuOpen = false" />
          <div class="relative z-10 w-72 bg-white dark:bg-gray-800 h-full flex flex-col shadow-2xl animate-slide-up">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span class="font-bold text-gray-900 dark:text-white">QeSuite</span>
              </div>
              <button @click="mobileMenuOpen = false" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <router-link
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                @click="mobileMenuOpen = false"
                :class="[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  $route.path.startsWith(item.to) ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                ]"
              >
                <component :is="item.icon" class="w-5 h-5" />
                {{ item.label }}
              </router-link>
            </nav>
            <div class="border-t border-gray-100 dark:border-gray-700 p-4">
              <button @click="handleLogout" class="w-full flex items-center gap-2 px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors">
                <ArrowRightOnRectangleIcon class="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ShoppingCartIcon, CubeIcon, TagIcon, TruckIcon, ChartBarIcon,
  Cog6ToothIcon, CreditCardIcon, BellIcon, Bars3Icon, XMarkIcon,
  ArrowRightOnRectangleIcon, MoonIcon, SunIcon, UsersIcon
} from '@heroicons/vue/24/outline'
import TrialBanner from '@/components/dashboard/TrialBanner.vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useOrdersStore } from '@/stores/orders'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const ordersStore = useOrdersStore()

const mobileMenuOpen = ref(false)

const navItems = [
  { to: '/orders', label: 'Orders', icon: ShoppingCartIcon },
  { to: '/products', label: 'Products', icon: CubeIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
  { to: '/delivery', label: 'Delivery Team', icon: UsersIcon },
  { to: '/analytics', label: 'Analytics', icon: ChartBarIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  { to: '/billing', label: 'Billing', icon: CreditCardIcon },
]

const mobileNavItems = [
  { to: '/orders', short: 'Orders', icon: ShoppingCartIcon },
  { to: '/products', short: 'Products', icon: CubeIcon },
  { to: '/analytics', short: 'Analytics', icon: ChartBarIcon },
  { to: '/delivery', short: 'Riders', icon: TruckIcon },
  { to: '/settings', short: 'Settings', icon: Cog6ToothIcon },
]

const newOrderCount = computed(() =>
  ordersStore.orders.filter(o => o.status === 'NEW').length
)

const userInitial = computed(() =>
  (authStore.user?.name || 'O')[0].toUpperCase()
)

const pageTitles: Record<string, string> = {
  '/orders': 'Orders',
  '/products': 'Products',
  '/categories': 'Categories',
  '/delivery': 'Delivery Team',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/billing': 'Billing',
}

const currentPageTitle = computed(() => {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (route.path.startsWith(path)) return title
  }
  return 'Dashboard'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await Promise.all([
    settingsStore.fetchTenant(),
    settingsStore.fetchStoreSettings()
  ])
  await ordersStore.fetchOrders()
  if (authStore.user?.tenant_id) {
    ordersStore.subscribeRealtime(authStore.user.tenant_id)
  }
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})
</script>
