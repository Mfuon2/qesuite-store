<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-5">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,132,71,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.05),transparent_40%)]" />

    <section class="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="qs-brand-mark h-10 w-10 shrink-0" />
        <div class="min-w-0">
          <p class="text-lg font-black leading-tight text-white">Store</p>
          <p class="text-xs font-medium text-slate-400">Platform administration</p>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="handleAdminLogin">
        <label class="block">
          <span class="text-xs font-medium text-slate-400">Admin Email</span>
          <input
            v-model="adminEmail"
            type="email"
            placeholder="admin@qesuite.com"
            class="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-primary"
            autocomplete="username"
            required
          />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-slate-400">Password</span>
          <input
            v-model="adminPassword"
            type="password"
            placeholder="Password"
            class="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-primary"
            autocomplete="current-password"
            required
          />
        </label>
        <p v-if="error" class="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">{{ error }}</p>
        <button
          type="submit"
          class="owner-primary-action mt-1 w-full justify-center disabled:opacity-60"
          :disabled="auth.loading"
        >
          {{ auth.loading ? 'Signing in...' : 'Admin sign in' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const adminEmail = ref('')
const adminPassword = ref('')
const error = ref('')

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
