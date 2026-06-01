<template>
  <div class="flex h-screen overflow-hidden bg-white text-slate-950">
    <aside class="hidden w-72 shrink-0 flex-col border-r border-slate-100 bg-white/95 backdrop-blur-xl lg:flex">
      <div class="flex items-center gap-3 px-6 py-6">
        <div class="qs-brand-mark shrink-0" />
        <div>
          <p class="qs-brand-word text-xl leading-tight"><span>QeSuite</span> Admin</p>
          <p class="text-xs font-medium text-slate-500">Platform console</p>
        </div>
      </div>

      <div class="mx-4 mb-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
        <div class="owner-eyebrow">Admin workspace</div>
        <p class="text-sm font-bold text-slate-900">Admin workspace</p>
        <p class="mt-1 text-xs font-medium leading-5 text-slate-500">Stores, billing, and platform health in one clean console.</p>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['qs-nav-link', isActive(item.to) ? 'qs-nav-link-active' : 'hover:bg-emerald-50/80 hover:text-emerald-800']"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-slate-100 p-4">
        <div class="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">{{ userInitial }}</div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-900">{{ auth.user?.name ?? 'Admin' }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
          </div>
        </div>
        <RouterLink
          to="/admin/profile"
          :class="['qs-nav-link', isActive('/admin/profile') ? 'qs-nav-link-active' : 'hover:bg-emerald-50/80']"
        >
          <UserCircleIcon class="h-5 w-5" />
          My Profile
        </RouterLink>
        <button class="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50" @click="handleLogout">
          <ArrowRightOnRectangleIcon class="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button class="rounded-lg p-2 text-slate-600 hover:bg-emerald-50" @click="sidebarOpen = !sidebarOpen">
          <Bars3Icon class="h-6 w-6" />
        </button>
        <span class="qs-brand-word text-lg"><span>QeSuite</span> Admin</span>
      </header>

      <main class="flex-1 overflow-y-auto bg-white">
        <RouterView />
      </main>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="sidebarOpen" class="fixed inset-0 z-50 flex lg:hidden">
          <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="sidebarOpen = false" />
          <div class="relative z-10 flex h-full w-72 flex-col bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div class="flex items-center gap-3">
                <div class="qs-brand-mark scale-90" />
                <span class="qs-brand-word text-lg"><span>QeSuite</span> Admin</span>
              </div>
              <button class="text-slate-400" @click="sidebarOpen = false">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            <nav class="flex-1 space-y-1 px-4 py-4">
              <RouterLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :class="['qs-nav-link', isActive(item.to) ? 'qs-nav-link-active' : 'hover:bg-emerald-50']"
                @click="sidebarOpen = false"
              >
                <component :is="item.icon" class="h-5 w-5" />
                {{ item.label }}
              </RouterLink>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BuildingStorefrontIcon, ChartBarSquareIcon, CreditCardIcon,
  UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/admin/ToastContainer.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const userInitial = computed(() =>
  (auth.user?.name ?? auth.user?.email ?? 'A')[0].toUpperCase()
)

const navItems = [
  { to: '/admin/stores', label: 'Stores', icon: BuildingStorefrontIcon },
  { to: '/admin/metrics', label: 'Platform Metrics', icon: ChartBarSquareIcon },
  { to: '/admin/billing', label: 'Billing', icon: CreditCardIcon },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}

async function handleLogout() {
  auth.logout()
  await router.push('/login')
}
</script>
