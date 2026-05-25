<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-4">
        <div class="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-md mb-2">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Create your store</h1>
        <p class="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Start your 14-day free trial</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5">
        <form @submit.prevent="handleRegister" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name *</label>
              <input
                v-model="form.store_name"
                type="text"
                placeholder="Mama Mboga Shop"
                required
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Jane Doe"
                required
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="jane@example.com"
                required
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="+254700000000"
                required
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="Min 8 characters"
                required
                minlength="8"
                class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon v-if="!showPwd" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              v-model="form.confirm"
              :type="showPwd ? 'text' : 'password'"
              placeholder="Repeat password"
              required
              :class="['w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                form.confirm && form.confirm !== form.password
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-600 focus:border-primary']"
            />
            <p v-if="form.confirm && form.confirm !== form.password" class="text-red-500 text-xs mt-0.5">Passwords do not match</p>
          </div>

          <div class="flex items-start gap-2">
            <input
              v-model="acceptedTerms"
              id="terms"
              type="checkbox"
              required
              class="mt-0.5 w-3.5 h-3.5 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <label for="terms" class="text-xs text-gray-600 dark:text-gray-400">
              I agree to the
              <a href="#" class="text-primary hover:text-accent">Terms of Service</a>
              and
              <a href="#" class="text-primary hover:text-accent">Privacy Policy</a>
            </label>
          </div>

          <Transition name="fade">
            <div v-if="error" class="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-xs">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0" />
              {{ error }}
            </div>
          </Transition>

          <button
            type="submit"
            :disabled="loading || !acceptedTerms || (!!form.confirm && form.confirm !== form.password)"
            class="w-full py-2 bg-primary hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span>{{ loading ? 'Creating account...' : 'Create Account' }}</span>
          </button>
        </form>

        <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?
          <router-link to="/login" class="text-primary hover:text-accent font-medium transition-colors">Sign in →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ store_name: '', name: '', email: '', phone: '', password: '', confirm: '' })
const showPwd = ref(false)
const acceptedTerms = ref(false)
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (form.password !== form.confirm) { error.value = 'Passwords do not match'; return }
  error.value = ''
  loading.value = true
  const result = await authStore.register({
    store_name: form.store_name.trim(),
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    password: form.password
  })
  loading.value = false
  if (result.success) {
    router.push('/onboarding')
  } else {
    error.value = result.error || 'Registration failed. Please try again.'
  }
}
</script>
