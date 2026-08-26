<template>
  <div class="flex h-screen qs-shell-bg overflow-hidden">
    <!-- Subscription wall — blocks all features when subscription is inactive -->
    <SubscriptionWall v-if="!settingsStore.isSubscriptionActive && !settingsStore.loading" />

    <aside class="hidden w-64 shrink-0 flex-col border-r border-[#d0daca]/70 bg-white/80 backdrop-blur-xl lg:flex">
      <div class="flex items-center gap-2.5 px-4 py-4">
        <div class="qs-brand-mark shrink-0" />
        <div class="min-w-0">
          <p class="qs-brand-word text-lg leading-tight"><span>Store</span></p>
          <p class="truncate text-xs text-slate-500">Business dashboard</p>
        </div>
      </div>

      <div class="mx-3 mb-3 rounded-xl border border-[#d0daca]/80 bg-white/70 p-2.5 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="owner-brand-surface grid h-9 w-9 place-items-center rounded-lg"><BuildingStorefrontIcon class="h-4 w-4" /></div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-900">{{ settingsStore.tenant?.name || "Mama Mboga's" }}</p>
            <p class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><span class="h-2 w-2 rounded-full bg-primary"></span> Open</p>
          </div>
          <span class="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Current</span>
        </div>
      </div>

      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['qs-nav-link group', isActiveNav(item.to) ? 'qs-nav-link-active' : 'owner-brand-hover hover:text-primary']"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
          <span
            v-if="item.to === '/orders' && newOrderCount > 0"
            class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
          >
            {{ newOrderCount > 99 ? '99+' : newOrderCount }}
          </span>
        </router-link>
      </nav>

      <!-- Subscription banner — always visible once tenant loads -->
      <div v-if="settingsStore.tenant" class="mx-3 mb-3 overflow-hidden rounded-xl border border-[#d0daca]/80 bg-white/80 shadow-sm">
        <!-- Plan + status row -->
        <div class="flex items-center justify-between gap-2 px-3 pb-1.5 pt-2.5">
          <div class="flex items-center gap-2 min-w-0">
            <component :is="planIcon" class="h-4 w-4 shrink-0 text-emerald-700" />
            <div class="min-w-0">
              <p class="truncate text-sm font-extrabold text-slate-950 leading-tight">{{ settingsStore.planLabel }} Plan</p>
              <p class="text-[11px] font-semibold capitalize leading-tight" :class="statusColor">
                {{ settingsStore.tenant.subscription_status?.replace('_', ' ') }}
              </p>
            </div>
          </div>
          <!-- Days pill -->
          <div v-if="settingsStore.subscriptionDaysLeft !== null"
            class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black"
            :class="settingsStore.subscriptionDaysLeft <= 3
              ? 'bg-red-100 text-red-700'
              : settingsStore.subscriptionDaysLeft <= 7
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-50 text-emerald-700'"
          >
            {{ settingsStore.subscriptionDaysLeft }}d left
          </div>
        </div>

        <!-- Progress bar showing how far through the billing period -->
        <div v-if="settingsStore.subscriptionDaysLeft !== null" class="px-3 pb-1">
          <div class="h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full transition-all"
              :class="settingsStore.subscriptionDaysLeft <= 3 ? 'bg-red-500' : settingsStore.subscriptionDaysLeft <= 7 ? 'bg-amber-400' : 'bg-primary'"
              :style="{ width: `${periodProgress}%` }"
            />
          </div>
        </div>

        <!-- CTA -->
        <div class="px-3 pb-2.5 pt-1.5">
          <p class="mb-2 text-[11px] leading-4 text-slate-500">
            <template v-if="settingsStore.isTrialing">Upgrade to keep growing after your trial ends.</template>
            <template v-else>Manage your plan and billing history.</template>
          </p>
          <RouterLink
            to="/billing"
            class="flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-105"
          >
            {{ settingsStore.isTrialing ? 'Upgrade Now' : 'Manage Billing' }}
          </RouterLink>
        </div>
      </div>

      <div class="border-t border-[#d0daca]/70 p-3">
        <button class="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600" @click="handleLogout">
          <ArrowRightOnRectangleIcon class="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex shrink-0 items-center gap-3 border-b border-[#d0daca]/70 bg-white/75 px-3 py-2 backdrop-blur-xl sm:px-5 lg:px-6">
        <button class="owner-brand-hover rounded-lg p-2 text-slate-600 transition-colors hover:text-primary lg:hidden" @click="mobileMenuOpen = !mobileMenuOpen">
          <Bars3Icon class="h-5 w-5" />
        </button>

        <h1 class="flex-1 truncate text-base font-bold text-slate-900 lg:hidden">{{ currentPageTitle }}</h1>

        <div class="relative hidden w-full max-w-xl lg:block">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input class="owner-input w-full border-[#d0daca] bg-white/80 pl-9 pr-10 text-slate-700 shadow-sm" placeholder="Search orders, products, customers..." />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">⌘K</span>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button class="owner-brand-hover rounded-lg p-2 text-slate-500 transition-colors hover:text-primary" @click="settingsStore.toggleDarkMode()">
            <MoonIcon v-if="!settingsStore.darkMode" class="h-5 w-5" />
            <SunIcon v-else class="h-5 w-5" />
          </button>
          <div class="relative">
            <button class="owner-brand-hover rounded-lg p-2 text-slate-500 transition-colors hover:text-primary">
              <BellIcon class="h-5 w-5" />
            </button>
            <span v-if="newOrderCount > 0" class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {{ newOrderCount > 9 ? '9+' : newOrderCount }}
            </span>
          </div>
          <RouterLink to="/settings" class="owner-brand-hover hidden items-center gap-2 rounded-xl py-1 pl-2 pr-1.5 sm:flex" title="Edit personal information in Settings">
            <div class="owner-brand-surface grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-primary">{{ userInitial }}</div>
            <div class="hidden md:block">
              <p class="max-w-44 truncate text-sm font-bold text-slate-900">{{ authStore.user?.name || 'Store owner' }}</p>
              <p class="text-xs text-slate-500">{{ authStore.role === 'staff' ? 'Store staff' : 'Store owner' }}</p>
            </div>
          </RouterLink>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </router-view>
      </main>

      <nav class="safe-bottom flex shrink-0 items-center border-t border-[#d0daca]/70 bg-white/95 lg:hidden">
        <router-link
          v-for="item in mobileNavItems"
          :key="item.to"
          :to="item.to"
          :class="['relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors', isActiveNav(item.to) ? 'text-primary' : 'text-slate-400']"
        >
          <div class="relative">
            <component :is="item.icon" class="h-5 w-5" />
            <span
              v-if="item.to === '/orders' && newOrderCount > 0"
              class="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
            >
              {{ newOrderCount > 9 ? '9+' : newOrderCount }}
            </span>
          </div>
          <span class="text-[10px] font-semibold">{{ item.short }}</span>
        </router-link>
      </nav>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 flex lg:hidden">
          <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="mobileMenuOpen = false" />
          <div class="relative z-10 flex h-full w-64 flex-col bg-white shadow-2xl animate-slide-up">
            <div class="flex items-center justify-between border-b border-[#d0daca]/70 px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="qs-brand-mark scale-90" />
                <span class="qs-brand-word text-lg"><span>Store</span> </span>
              </div>
              <button class="p-1.5 text-slate-400 hover:text-slate-600" @click="mobileMenuOpen = false">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
              <router-link
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :class="['qs-nav-link', isActiveNav(item.to) ? 'qs-nav-link-active' : 'owner-brand-hover']"
                @click="mobileMenuOpen = false"
              >
                <component :is="item.icon" class="h-5 w-5" />
                {{ item.label }}
              </router-link>
            </nav>
            <div class="border-t border-[#d0daca]/70 p-4">
              <button class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50" @click="handleLogout">
                <ArrowRightOnRectangleIcon class="h-5 w-5" />
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
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ShoppingCartIcon, CubeIcon, TagIcon, TruckIcon, ChartBarIcon,
  Cog6ToothIcon, CreditCardIcon, BellIcon, Bars3Icon, XMarkIcon,
  ArrowRightOnRectangleIcon, MoonIcon, SunIcon, UsersIcon,
  Squares2X2Icon, MagnifyingGlassIcon,
  BoltIcon, BuildingStorefrontIcon, RocketLaunchIcon, SparklesIcon, TrophyIcon,
  BanknotesIcon, ReceiptRefundIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useOrdersStore } from '@/stores/orders'
import { useAccessStore } from '@/stores/access'
import SubscriptionWall from '@/components/dashboard/SubscriptionWall.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const ordersStore = useOrdersStore()
const accessStore = useAccessStore()

const mobileMenuOpen = ref(false)

const isRestaurant = computed(() => settingsStore.tenant?.store_category === 'food')

const navItems = computed(() => [
  { to: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon, permission: 'dashboard.view' },
  { to: '/orders', label: 'Orders', icon: ShoppingCartIcon, permission: 'orders.view' },
  ...(isRestaurant.value ? [
    { to: '/pos', label: 'POS', icon: BanknotesIcon, permission: 'pos.view' },
    { to: '/expenses', label: 'Expenses', icon: ReceiptRefundIcon, permission: 'expenses.view' },
  ] : []),
  { to: '/products', label: 'Products', icon: CubeIcon, permission: 'products.view' },
  { to: '/categories', label: 'Categories', icon: TagIcon, permission: 'categories.view' },
  { to: '/delivery', label: 'Delivery Team', icon: UsersIcon, permission: 'delivery.view' },
  { to: '/analytics', label: 'Analytics', icon: ChartBarIcon, permission: 'analytics.view' },
  { to: '/notifications', label: 'Notifications', icon: BellIcon, permission: 'notifications.view' },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon, permission: 'settings.view' },
  { to: '/billing', label: 'Billing', icon: CreditCardIcon, permission: 'billing.view' },
].filter(item => accessStore.can(item.permission)))

const mobileNavItems = computed(() => navItems.value.slice(0, 6).map(item => ({
  to: item.to,
  short: item.to === '/dashboard' ? 'Home' : item.label.split(' ')[0],
  icon: item.icon,
})))

const newOrderCount = computed(() =>
  ordersStore.orders.filter(o => o.status === 'NEW').length
)

const planIcon = computed(() => {
  const p = settingsStore.tenant?.plan
  if (p === 'pro') return BoltIcon
  if (p === 'growth') return RocketLaunchIcon
  if (p === 'starter') return SparklesIcon
  return TrophyIcon
})

const statusColor = computed(() => {
  const s = settingsStore.tenant?.subscription_status
  if (s === 'active') return 'text-emerald-600'
  if (s === 'trialing') return 'text-amber-600'
  if (s === 'cancelled') return 'text-red-600'
  return 'text-slate-400'
})

// How much of the billing period has elapsed (0–100), shown as a progress bar
const periodProgress = computed(() => {
  const daysLeft = settingsStore.subscriptionDaysLeft
  if (daysLeft === null) return 0
  const status = settingsStore.tenant?.subscription_status
  const totalDays = status === 'trialing' ? 14 : 30 // trial default 14d, paid 30d
  const elapsed = Math.max(0, totalDays - daysLeft)
  return Math.min(100, Math.round((elapsed / totalDays) * 100))
})

const userInitial = computed(() =>
  (authStore.user?.name || 'O')[0].toUpperCase()
)

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'POS',
  '/orders': 'Orders',
  '/products': 'Products',
  '/categories': 'Categories',
  '/delivery': 'Delivery Team',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/billing': 'Billing',
}

function isActiveNav(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
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
    settingsStore.fetchStoreSettings(),
    authStore.fetchMe()
  ])
  if (accessStore.can('orders.view')) await ordersStore.fetchOrders()
  if (accessStore.can('orders.view') && authStore.user?.tenant_id) {
    ordersStore.subscribeRealtime(authStore.user.tenant_id)
  }
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})
</script>
