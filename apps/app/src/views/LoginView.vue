<template>
  <div class="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
    <img
      src="/auth-marketplace-wallpaper.webp"
      alt=""
      class="absolute inset-0 h-full w-full object-cover object-left"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-white/10 via-white/15 to-white/40 backdrop-blur-[1px]" />

    <div class="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1680px] flex-col">
      <header class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <div class="qs-brand-mark h-11 w-11 shrink-0" />
          <div class="min-w-0">
            <p class="qs-brand-word text-xl leading-tight"><span>Store</span> </p>
            <p class="text-xs font-medium text-slate-500">Owner workspace</p>
          </div>
        </div>
        <router-link
          to="/register"
          class="owner-secondary-action hidden min-h-10 rounded-xl px-3 py-2 sm:inline-flex"
        >
          Create account
        </router-link>
      </header>

      <main class="flex flex-1 items-center justify-center py-6 lg:justify-end lg:py-8">
        <section class="relative w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
          <div class="relative">

            <!-- Store selector -->
            <div v-if="auth.pendingStoreSelection" class="p-6 sm:p-8">
              <button
                class="mb-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                @click="auth.pendingStoreSelection = null; error = ''"
              >
                <ArrowLeftIcon class="h-3.5 w-3.5" /> Back
              </button>
              <div class="mb-5">
                <h2 class="owner-title">Which store?</h2>
                <p class="owner-subtitle">Your phone is linked to {{ auth.pendingStoreSelection.stores.length }} stores. Pick one to continue.</p>
              </div>
              <p v-if="error" class="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{{ error }}</p>
              <div class="space-y-2.5">
                <button
                  v-for="store in auth.pendingStoreSelection.stores"
                  :key="store.tenant_id"
                  :disabled="auth.loading"
                  class="group w-full flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                  @click="handleSelectStore(store.tenant_id)"
                >
                  <div
                    class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-lg font-black shadow-sm"
                    :style="store.logo_url ? '' : `background-color: ${store.primary_color}20; color: ${store.primary_color}`"
                  >
                    <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="h-full w-full object-cover" />
                    <span v-else>{{ store.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-bold text-slate-900">{{ store.name }}</p>
                    <p class="truncate text-xs text-slate-400">{{ storefrontUrl }}/{{ store.slug }}</p>
                  </div>
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-primary/10 transition-colors">
                    <span v-if="auth.loading && selectingTenantId === store.tenant_id" class="h-4 w-4 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
                    <ChevronRightIcon v-else class="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Normal login form -->
            <div v-else class="p-6 sm:p-8">
              <div class="mb-5">
                <h2 class="owner-title">Welcome back</h2>
                <p class="owner-subtitle">Log in to manage your store, track orders, and keep operations moving.</p>
              </div>

              <!-- Role tabs -->
              <div class="owner-segmented mb-5 grid w-full grid-cols-3">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="owner-segment-button h-10 rounded-xl text-xs"
                  :class="activeTab === tab.id ? 'owner-segment-button-active' : ''"
                  @click="activeTab = tab.id; error = ''"
                >
                  {{ tab.label }}
                </button>
              </div>

            <!-- Owner login form -->
            <form v-if="activeTab === 'owner'" class="space-y-4" @submit.prevent="handleOwnerLogin">
              <label class="block">
                <span class="admin-label">Email or Phone</span>
                <input
                  v-model="ownerCredential"
                  type="text"
                  placeholder="hello@store.com or +254700000000"
                  class="owner-input mt-2"
                  autocomplete="username"
                  required
                />
              </label>
              <label class="block">
                <span class="admin-label">Password</span>
                <input
                  v-model="ownerPassword"
                  type="password"
                  placeholder="Password"
                  class="owner-input mt-2"
                  autocomplete="current-password"
                  required
                />
              </label>
              <p v-if="error" class="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{{ error }}</p>
              <button type="submit" class="owner-primary-action mt-1 w-full justify-center" :disabled="auth.loading">
                {{ auth.loading ? 'Signing in...' : 'Sign in' }}
              </button>
              <div class="flex items-center gap-3 py-1 text-xs font-medium text-slate-400">
                <div class="h-px flex-1 bg-slate-200"></div>
                or continue with
                <div class="h-px flex-1 bg-slate-200"></div>
              </div>
              <p class="text-center text-xs font-medium text-slate-500">
                No account/Store?
                <router-link to="/register" class="font-bold text-primary hover:text-accent">Create/Onboard your store today</router-link>
              </p>
            </form>

            <!-- Rider login form -->
            <div v-else-if="activeTab === 'rider'">
              <form v-if="!riderLinkSent" class="space-y-4" @submit.prevent="handleRiderRequest">
                <label class="block">
                  <span class="admin-label">Phone Number</span>
                  <input
                    v-model="riderPhone"
                    type="tel"
                    placeholder="+254700000000"
                    class="owner-input mt-2"
                    required
                  />
                </label>
                <p v-if="error" class="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{{ error }}</p>
                <button type="submit" class="owner-primary-action w-full justify-center" :disabled="auth.loading">
                  {{ auth.loading ? 'Sending...' : 'Send magic link' }}
                </button>
              </form>
              <div v-else class="owner-brand-surface rounded-[24px] border p-6 text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-sm font-bold text-slate-950">Magic link sent</p>
                <p class="mt-1 text-xs font-medium text-slate-500">Check your SMS to continue.</p>
                <button type="button" class="mt-4 text-xs font-bold text-primary hover:text-accent" @click="riderLinkSent = false">
                  Try a different number
                </button>
              </div>
            </div>

            <!-- Admin login form -->
            <form v-else-if="activeTab === 'admin'" class="space-y-4" @submit.prevent="handleAdminLogin">
              <label class="block">
                <span class="admin-label">Admin Email</span>
                <input
                  v-model="adminEmail"
                  type="email"
                  placeholder="admin@qesuite.com"
                  class="owner-input mt-2"
                  required
                />
              </label>
              <label class="block">
                <span class="admin-label">Password</span>
                <input
                  v-model="adminPassword"
                  type="password"
                  placeholder="Password"
                  class="owner-input mt-2"
                  required
                />
              </label>
              <p v-if="error" class="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{{ error }}</p>
              <button
                type="submit"
                class="owner-primary-action mt-1 w-full justify-center disabled:opacity-60"
                :disabled="auth.loading"
              >
                {{ auth.loading ? 'Signing in...' : 'Admin sign in' }}
              </button>
            </form>
            </div><!-- /normal login form -->
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const activeTab = ref<'owner' | 'rider' | 'admin'>('owner')
const error = ref('')
const selectingTenantId = ref<string | null>(null)

const ownerCredential = ref('')
const ownerPassword = ref('')
const riderPhone = ref('')
const riderLinkSent = ref(false)
const adminEmail = ref('')
const adminPassword = ref('')

const storefrontUrl = (import.meta.env.VITE_STOREFRONT_URL ?? 'https://store.qesuite.com').replace(/\/$/, '')

const tabs = [
  { id: 'owner', label: 'Owner / Staff' },
  { id: 'rider', label: 'Rider' },
  { id: 'admin', label: 'Admin' },
] as const

async function handleOwnerLogin() {
  error.value = ''
  const res = await auth.login(ownerCredential.value.trim(), ownerPassword.value)
  if (!res.success) {
    error.value = res.error || 'Login failed'
    return
  }
  if ('requires_store_selection' in res && res.requires_store_selection) {
    // Store selector screen now shows — no redirect yet
    return
  }
  router.push(auth.onboardingComplete ? '/dashboard' : '/onboarding')
}

async function handleSelectStore(tenantId: string) {
  error.value = ''
  selectingTenantId.value = tenantId
  const res = await auth.selectStore(tenantId)
  selectingTenantId.value = null
  if (res.success) {
    router.push(auth.onboardingComplete ? '/dashboard' : '/onboarding')
  } else {
    error.value = res.error || 'Store selection failed'
  }
}

async function handleRiderRequest() {
  error.value = ''
  try {
    await auth.requestRiderLink(riderPhone.value.trim())
    riderLinkSent.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to send link'
  }
}

async function handleAdminLogin() {
  error.value = ''
  const res = await auth.adminSignIn(adminEmail.value.trim(), adminPassword.value)
  if (res.success) {
    router.push('/admin/stores')
  } else {
    error.value = res.error || 'Login failed'
  }
}
</script>
