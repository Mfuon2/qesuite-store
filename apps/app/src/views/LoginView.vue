<template>
  <div class="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
    <img
      src="/login-wallpaper.png"
      alt=""
      class="absolute inset-0 h-full w-full object-cover object-left"
    />
    <div class="absolute inset-0 bg-white/62 backdrop-blur-[1px]" />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_74%_44%,rgba(255,255,255,0.96)_0,rgba(255,255,255,0.9)_26rem,rgba(255,255,255,0.48)_50rem,transparent_72rem)]" />
    <div class="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-white via-white/90 to-white/28 lg:w-[54%]" />

    <div class="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
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

      <main class="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-10">
        <section class="hidden lg:block">
          <div class="relative min-h-[560px] overflow-hidden rounded-[32px] border border-white/55 bg-white/20 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div class="absolute inset-0 bg-gradient-to-br from-white/64 via-white/26 to-white/8" />
            <div class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/58 to-transparent" />
            <div class="relative flex h-full min-h-[560px] flex-col justify-end p-8">
              <div class="max-w-xl">
                <div class="owner-eyebrow">Store operations</div>
                <h1 class="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">
                  Run orders, catalog, delivery, and billing from one calm workspace.
                </h1>
                <p class="mt-3 max-w-lg text-sm font-medium leading-6 text-slate-500">
                  Sign in to continue managing your store with the same polished owner-console experience across the platform.
                </p>
              </div>

              <div class="mt-8 grid grid-cols-3 gap-3">
                <div class="owner-stat-card">
                  <div class="owner-stat-icon h-10 w-10">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M6 7v11a2 2 0 002 2h8a2 2 0 002-2V7M9 7V5a3 3 0 016 0v2" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-950">Orders</p>
                    <p class="text-xs font-medium text-slate-500">Live queue</p>
                  </div>
                </div>
                <div class="owner-stat-card">
                  <div class="owner-stat-icon h-10 w-10">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-950">Products</p>
                    <p class="text-xs font-medium text-slate-500">Catalog</p>
                  </div>
                </div>
                <div class="owner-stat-card">
                  <div class="owner-stat-icon h-10 w-10">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4v11h9zm0 0h2m-2-5h4l3 3v2h-3" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-950">Delivery</p>
                    <p class="text-xs font-medium text-slate-500">Riders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mx-auto w-full max-w-[460px]">
          <div class="owner-panel p-5 sm:p-6">
            <div class="mb-5">
              <div class="owner-eyebrow">Secure sign in</div>
              <h1 class="owner-title">Welcome back</h1>
              <p class="owner-subtitle">
                Log in to manage your store, track orders, and keep operations moving.
              </p>
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
                  placeholder="hello@store.com"
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
                No account?
                <router-link to="/register" class="font-bold text-primary hover:text-accent">Create one</router-link>
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
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const activeTab = ref<'owner' | 'rider' | 'admin'>('owner')
const error = ref('')

const ownerCredential = ref('')
const ownerPassword = ref('')
const riderPhone = ref('')
const riderLinkSent = ref(false)
const adminEmail = ref('')
const adminPassword = ref('')

const tabs = [
  { id: 'owner', label: 'Store Owner' },
  { id: 'rider', label: 'Rider' },
  { id: 'admin', label: 'Admin' },
] as const

async function handleOwnerLogin() {
  error.value = ''
  const res = await auth.login(ownerCredential.value.trim(), ownerPassword.value)
  if (res.success) {
    router.push(auth.onboardingComplete ? '/dashboard' : '/onboarding')
  } else {
    error.value = res.error || 'Login failed'
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
