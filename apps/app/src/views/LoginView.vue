<template>
  <!-- Full-screen wallpaper -->
  <div
    class="relative min-h-screen flex items-center justify-center p-4"
    style="
      background-image: url('/login-bg.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    "
  >
    <!-- Scrim: darkens the illustration so the card stands out -->
    <div class="absolute inset-0 bg-black/40" />

    <div class="relative z-10 w-full max-w-sm">
      <!-- Frosted-glass card with logo inside -->
      <div class="bg-white/92 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/50 border border-white/70 p-6">
        <!-- Logo header inside card -->
        <div class="text-center mb-5">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 mb-2.5 shadow-md">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-xl font-black text-gray-900">QeSuite</h1>
          <p class="text-gray-500 text-xs mt-0.5">Sign in to continue</p>
        </div>
        <!-- Role tabs -->
        <div class="flex rounded-xl bg-gray-100 p-1 mb-5 gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
            :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = tab.id; error = ''"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Owner login form -->
        <form v-if="activeTab === 'owner'" class="space-y-3" @submit.prevent="handleOwnerLogin">
          <div>
            <label class="qs-label">Email or Phone</label>
            <input
              v-model="ownerCredential"
              type="text"
              placeholder="hello@store.com"
              class="qs-input"
              autocomplete="username"
              required
            />
          </div>
          <div>
            <label class="qs-label">Password</label>
            <input
              v-model="ownerPassword"
              type="password"
              placeholder="••••••••"
              class="qs-input"
              autocomplete="current-password"
              required
            />
          </div>
          <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
          <button type="submit" class="qs-btn-primary w-full justify-center py-2.5 mt-1" :disabled="auth.loading">
            {{ auth.loading ? 'Signing in…' : 'Sign In' }}
          </button>
          <p class="text-center text-xs text-gray-500">
            No account?
            <router-link to="/register" class="text-emerald-600 hover:text-emerald-700 font-medium">Create one</router-link>
          </p>
        </form>

        <!-- Rider login form -->
        <div v-else-if="activeTab === 'rider'">
          <form v-if="!riderLinkSent" class="space-y-3" @submit.prevent="handleRiderRequest">
            <div>
              <label class="qs-label">Phone Number</label>
              <input
                v-model="riderPhone"
                type="tel"
                placeholder="+254700000000"
                class="qs-input"
                required
              />
            </div>
            <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
            <button type="submit" class="qs-btn-primary w-full justify-center py-2.5" :disabled="auth.loading">
              {{ auth.loading ? 'Sending…' : 'Send Magic Link' }}
            </button>
          </form>
          <div v-else class="text-center py-6">
            <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-gray-900 font-semibold text-sm">Magic link sent!</p>
            <p class="text-gray-500 text-xs mt-1">Check your SMS to continue.</p>
            <button type="button" class="text-emerald-600 text-xs mt-3 hover:underline" @click="riderLinkSent = false">
              Try a different number
            </button>
          </div>
        </div>

        <!-- Admin login form -->
        <form v-else-if="activeTab === 'admin'" class="space-y-3" @submit.prevent="handleAdminLogin">
          <div>
            <label class="qs-label">Admin Email</label>
            <input
              v-model="adminEmail"
              type="email"
              placeholder="admin@qesuite.com"
              class="qs-input"
              required
            />
          </div>
          <div>
            <label class="qs-label">Password</label>
            <input
              v-model="adminPassword"
              type="password"
              placeholder="••••••••"
              class="qs-input"
              required
            />
          </div>
          <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
          <button
            type="submit"
            class="w-full py-2.5 mt-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-60"
            :disabled="auth.loading"
          >
            {{ auth.loading ? 'Signing in…' : 'Admin Sign In' }}
          </button>
        </form>
      </div>
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
    router.push(auth.onboardingComplete ? '/orders' : '/onboarding')
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
