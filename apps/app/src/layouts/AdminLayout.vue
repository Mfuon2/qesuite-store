<template>
  <div class="flex h-screen overflow-hidden bg-slate-900">
    <!-- Sidebar -->
    <aside
      class="flex flex-col w-64 flex-shrink-0 bg-slate-800 border-r border-slate-700"
      :class="{ 'hidden lg:flex': !sidebarOpen }"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <p class="text-white font-bold text-sm leading-none">QeSuite Admin</p>
          <p class="text-slate-400 text-xs mt-0.5">Platform Console</p>
        </div>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group"
          :class="isActive(item.to)
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User info + logout -->
      <div class="px-3 py-4 border-t border-slate-700">
        <div class="flex items-center gap-3 px-2 py-2 mb-2">
          <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs font-bold">{{ userInitial }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-slate-200 text-sm font-medium truncate">{{ auth.user?.name ?? 'Admin' }}</p>
            <p class="text-slate-500 text-xs truncate">{{ auth.user?.email }}</p>
          </div>
        </div>
        <RouterLink
          to="/admin/profile"
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive('/admin/profile')
            ? 'bg-slate-700 text-slate-100'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          My Profile
        </RouterLink>
        <button
          class="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          @click="handleLogout"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar (mobile) -->
      <div class="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
        <button
          class="text-slate-400 hover:text-slate-100"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="text-white font-semibold">QeSuite Admin</span>
      </div>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>

    <!-- Toast container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/admin/ToastContainer.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const userInitial = computed(() =>
  (auth.user?.name ?? auth.user?.email ?? 'A')[0].toUpperCase()
)

// Simple inline SVG icon components for nav
const IconStores = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
      d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }))

const IconMetrics = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
      d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }))

const IconBilling = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
      d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }))

const IconProfile = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
      d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }))

const navItems = [
  { to: '/admin/stores', label: 'Stores', icon: IconStores },
  { to: '/admin/metrics', label: 'Platform Metrics', icon: IconMetrics },
  { to: '/admin/billing', label: 'Billing', icon: IconBilling },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}

async function handleLogout() {
  auth.logout()
  await router.push('/login')
}
</script>
