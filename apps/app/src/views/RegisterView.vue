<template>
  <div class="relative min-h-screen overflow-hidden px-4 py-8">
    <img
      src="/auth-marketplace-wallpaper.webp"
      alt=""
      class="absolute inset-0 h-full w-full object-cover object-left"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-white/20 via-white/45 to-[#eef8ec]/80 backdrop-blur-[1px]" />
    <div class="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1680px] flex-col items-center justify-center gap-8 pt-32 sm:pt-40 lg:items-end lg:pt-8">
      <div class="w-full max-w-xl rounded-2xl border border-white/80 bg-white/95 p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl sm:p-8">
        <div class="mb-5 text-center">
          <h1 class="text-2xl font-extrabold text-emerald-800">Create your account</h1>
          <p class="mt-2 text-sm text-slate-500">Join Stores and grow your business.</p>
        </div>
        <form @submit.prevent="handleRegister" class="space-y-3">
          <!-- Store Name with live availability check -->
          <div>
            <label class="block text-xs font-medium text-gray-700  mb-1">Store Name *</label>
            <div class="relative">
              <input
                v-model="form.store_name"
                type="text"
                placeholder="Mama Mboga Shop"
                required
                :class="['w-full px-3 py-2 pr-8 rounded-lg border bg-gray-50  text-gray-900  placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                  storeNameStatus === 'taken'      ? 'border-red-400 ' :
                  storeNameStatus === 'available'  ? 'border-emerald-400 ' :
                  'border-gray-200  focus:border-primary']"
                @input="handleStoreNameInput"
              />
              <div class="absolute right-2.5 top-1/2 -translate-y-1/2">
                <svg v-if="storeNameChecking" class="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <svg v-else-if="storeNameStatus === 'available'" class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="storeNameStatus === 'taken'" class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <!-- URL preview / status -->
            <p v-if="storeNameStatus === 'available'" class="text-emerald-600  text-xs mt-1 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Available · Your URL: <span class="font-mono font-medium">{{ storefrontBase }}/{{ storeSlugPreview }}</span>
            </p>
            <p v-else-if="storeNameStatus === 'taken'" class="text-red-500 text-xs mt-1">
              "{{ form.store_name }}" is already taken. Try a different name.
            </p>
            <p v-else-if="form.store_name.length > 0 && !storeNameChecking" class="text-gray-400 text-xs mt-1 font-mono">
              {{ storefrontBase }}/{{ storeSlugPreview }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700  mb-1">Your Name *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Jane Doe"
              required
              class="w-full px-3 py-2 rounded-lg border border-gray-200  bg-gray-50  text-gray-900  placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            /></div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700  mb-1">Email</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="jane@example.com"
                required
                class="w-full px-3 py-2 rounded-lg border border-gray-200  bg-gray-50  text-gray-900  placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700  mb-1">Phone</label>
              <QePhoneInput v-model="form.phone" required />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700  mb-1">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="Min 8 characters"
                required
                minlength="8"
                class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200  bg-gray-50  text-gray-900  placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon v-if="!showPwd" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700  mb-1">Confirm Password</label>
            <input
              v-model="form.confirm"
              :type="showPwd ? 'text' : 'password'"
              placeholder="Repeat password"
              required
              :class="['w-full px-3 py-2 rounded-lg border bg-gray-50  text-gray-900  placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                form.confirm && form.confirm !== form.password
                  ? 'border-red-400 '
                  : 'border-gray-200  focus:border-primary']"
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
            <label for="terms" class="text-xs text-gray-600 ">
              I agree to the
              <a href="#" class="text-primary hover:text-accent">Terms of Service</a>
              and
              <a href="#" class="text-primary hover:text-accent">Privacy Policy</a>
            </label>
          </div>

          <Transition name="fade">
            <div v-if="error" class="flex items-center gap-2 px-3 py-2 bg-red-50  border border-red-200  text-red-700  rounded-lg text-xs">
              <ExclamationCircleIcon class="w-4 h-4 shrink-0" />
              {{ error }}
            </div>
          </Transition>

          <button
            type="submit"
            :disabled="loading || !acceptedTerms || (!!form.confirm && form.confirm !== form.password) || storeNameStatus === 'taken'"
            class="qs-btn qs-btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span>{{ loading ? 'Creating account...' : 'Create Account' }}</span>
          </button>
        </form>

        <p class="text-center text-xs text-gray-500  mt-4">
          Already have an account?
          <router-link to="/login" class="text-primary hover:text-accent font-medium transition-colors">Login</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { QePhoneInput } from '@qesuite/ui'
import { useAuthStore } from '@/stores/auth'
import { apiCheckStoreName } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ store_name: '', name: '', email: '', phone: '', password: '', confirm: '' })
const showPwd = ref(false)
const acceptedTerms = ref(false)
const loading = ref(false)
const error = ref('')

const storeNameStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const storeNameChecking = computed(() => storeNameStatus.value === 'checking')
const storeSlugPreview = computed(() =>
  form.store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 30)
)

const storefrontBase = computed(() =>
  (import.meta.env.VITE_STOREFRONT_URL || window.location.origin).replace(/\/$/, '')
)

let storeNameTimer: ReturnType<typeof setTimeout>

function handleStoreNameInput() {
  storeNameStatus.value = 'idle'
  const name = form.store_name.trim()
  if (name.length < 2) return
  clearTimeout(storeNameTimer)
  storeNameStatus.value = 'checking'
  storeNameTimer = setTimeout(async () => {
    try {
      const res = await apiCheckStoreName(name)
      storeNameStatus.value = res.success && res.data?.available ? 'available' : 'taken'
    } catch {
      storeNameStatus.value = 'idle'
    }
  }, 500)
}

async function handleRegister() {
  if (form.password !== form.confirm) { error.value = 'Passwords do not match'; return }
  if (storeNameStatus.value === 'taken') { error.value = 'That store name is already taken'; return }
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
