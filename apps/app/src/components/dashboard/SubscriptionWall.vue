<template>
  <div class="fixed inset-0 z-[220] overflow-y-auto qs-shell-bg">
    <div class="sticky top-0 z-20 border-b border-slate-100 bg-white/92 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-[1260px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <div class="qs-brand-mark shrink-0" />
          <div class="min-w-0">
            <p class="qs-brand-word text-lg leading-tight"><span>Store</span></p>
            <p class="truncate text-xs font-medium text-slate-500">Owner Console</p>
          </div>
        </div>
        <button
          class="owner-secondary-action min-h-10 py-2"
          @click="logout"
        >
          <ArrowRightOnRectangleIcon class="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>

    <main class="mx-auto w-full max-w-[1260px] px-4 py-8 sm:px-6 lg:px-8">
      <section class="owner-page-hero">
        <div class="owner-page-header">
          <div class="min-w-0">
            <div class="owner-eyebrow">
              Account attention
            </div>
            <h1 class="owner-title">
              {{ isExpired ? 'Your trial has expired' : 'Subscription required' }}
            </h1>
            <p class="owner-subtitle max-w-3xl">
              {{ isExpired
                ? 'Your free trial has ended. Pick a plan and complete payment to unlock dashboard access and continue receiving orders.'
                : 'Your store currently has no active subscription. Choose a plan below to reactivate operations.'
              }}
            </p>
          </div>

          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl ring-1"
            :class="isExpired ? 'bg-red-50 text-red-600 ring-red-200' : 'bg-amber-50 text-amber-600 ring-amber-200'"
          >
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>
      </section>

      <!-- Reminder notice -->
      <div
        v-if="daysSinceActive > 0"
        class="mx-auto mb-2 w-full max-w-[1260px] px-4 sm:px-6 lg:px-8"
      >
        <div
          class="flex items-start gap-3 rounded-2xl border px-4 py-3"
          :class="daysSinceActive > 13 ? 'border-red-200 bg-red-50' : daysSinceActive > 5 ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'"
        >
          <span class="mt-0.5 text-lg">{{ daysSinceActive > 13 ? '🚨' : daysSinceActive > 5 ? '⚠️' : '📣' }}</span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold" :class="daysSinceActive > 13 ? 'text-red-800' : daysSinceActive > 5 ? 'text-amber-800' : 'text-blue-800'">
              Your store has been inactive for {{ daysSinceActive }} day{{ daysSinceActive !== 1 ? 's' : '' }}
            </p>
            <p class="mt-0.5 text-xs" :class="daysSinceActive > 13 ? 'text-red-600' : daysSinceActive > 5 ? 'text-amber-600' : 'text-blue-600'">
              Customers cannot find or visit your store until you activate a subscription. Orders placed during this period are unavailable.
            </p>
          </div>
        </div>
      </div>

      <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div class="owner-panel">
          <div class="owner-panel-header">
            <div>
              <h2 class="owner-section-title">Choose a Plan</h2>
              <p class="owner-section-copy">Scale your store with features that match your current growth stage.</p>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <button
              v-for="plan in plans"
              :key="plan.id"
              @click="selectedPlan = plan.id"
              :class="[
                'owner-card relative p-4 text-left',
                selectedPlan === plan.id ? 'owner-brand-selected border-2' : 'border'
              ]"
            >
              <span
                v-if="plan.popular"
                class="absolute -top-2 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white"
              >
                Popular
              </span>

              <div :class="['mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg', plan.iconBg]">
                {{ plan.emoji }}
              </div>
              <p class="text-sm font-bold text-slate-950">{{ plan.name }}</p>
              <p class="mt-1 text-4xl font-black tracking-tight text-slate-950">KES {{ plan.price.toLocaleString() }}</p>
              <p class="-mt-1 text-sm font-semibold text-slate-400">per month</p>

              <ul class="mt-4 space-y-2">
                <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-xs font-medium text-slate-600">
                  <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <div v-if="selectedPlan === plan.id" class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div class="owner-panel">
            <div class="owner-panel-header">
              <div>
                <h2 class="owner-section-title">Pay Now</h2>
                <p class="owner-section-copy">Complete payment and your store will reactivate automatically.</p>
              </div>
            </div>

            <div v-if="activePlan" class="owner-brand-surface rounded-2xl border px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-bold text-slate-950">{{ activePlan.name }}</p>
                <p class="text-sm font-black text-primary">KES {{ activePlan.price.toLocaleString() }}/mo</p>
              </div>
              <p class="mt-1 text-xs font-medium text-slate-500">Billed monthly · Cancel anytime</p>
            </div>

            <div class="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex h-11 w-11 overflow-hidden rounded-xl">
                  <img src="/mpesa.png" alt="M-Pesa" class="h-full w-full object-cover" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-950">M-Pesa</p>
                  <p class="text-xs font-medium text-slate-500">STK push to your phone</p>
                </div>
              </div>

              <template v-if="!mpesaSuccess">
                <input
                  v-model="mpesaPhone"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  class="owner-input w-full"
                  :disabled="paying"
                />
                <button
                  @click="payWithMpesa"
                  :disabled="!mpesaPhone || paying || !selectedPlan"
                  class="owner-primary-action mt-3 w-full justify-center"
                >
                  <svg v-if="paying" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {{ paying ? 'Sending STK push...' : `Pay KES ${activePlan?.price.toLocaleString()}` }}
                </button>
              </template>

              <template v-else>
                <div class="owner-brand-surface rounded-xl border p-4 text-center">
                  <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary ring-1 ring-slate-100">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p class="text-sm font-bold text-slate-900">Check your phone</p>
                  <p class="mt-1 text-xs font-medium leading-5 text-slate-600">Enter your M-Pesa PIN to confirm payment, then refresh status below.</p>
                  <button
                    class="mt-3 text-xs font-semibold text-primary underline underline-offset-2"
                    @click="checkActivation"
                  >
                    I have paid, refresh status
                  </button>
                </div>
              </template>

              <p v-if="payError" class="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                {{ payError }}
              </p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white/70 p-4 opacity-75">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-900">Credit / Debit card</p>
                  <p class="text-xs font-medium text-slate-500">Coming soon · Powered by Stripe</p>
                </div>
              </div>
            </div>
          </div>

          <p class="text-center text-xs font-medium text-slate-400">
            Need help?
            <a href="mailto:support@qesuite.com" class="font-semibold text-primary underline underline-offset-2">Contact support</a>
          </p>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { apiInitiateMpesaPayment } from '@/api/settings'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const plans = [
  {
    id: 'starter', name: 'Starter', price: 999, popular: false, emoji: '🌱',
    iconBg: 'bg-emerald-50',
    features: ['Up to 100 products', 'Order management', 'Delivery team (2 riders)', 'Basic analytics'],
  },
  {
    id: 'growth', name: 'Growth', price: 1999, popular: true, emoji: '🚀',
    iconBg: 'bg-blue-50',
    features: ['Up to 500 products', 'Everything in Starter', 'Unlimited riders', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'pro', name: 'Pro', price: 3999, popular: false, emoji: '⚡',
    iconBg: 'bg-violet-50',
    features: ['Unlimited products', 'Everything in Growth', 'Custom domain', 'API access', 'Dedicated support'],
  },
]

const selectedPlan = ref('starter')
const mpesaPhone = ref(settingsStore.tenant?.phone ?? '')
const paying = ref(false)
const payError = ref('')
const mpesaSuccess = ref(false)

const isExpired = computed(() => {
  const status = settingsStore.tenant?.subscription_status
  return status === 'trialing' || status === undefined // trial ended or never had sub
})

// How many days the store has been in an inactive state
const daysSinceActive = computed(() => {
  const t = settingsStore.tenant
  if (!t) return 0
  // For expired trial, measure from trial_ends_at
  if (t.subscription_status === 'trialing' && t.trial_ends_at) {
    const diff = Date.now() - new Date(t.trial_ends_at).getTime()
    return Math.max(0, Math.floor(diff / 86_400_000))
  }
  // For cancelled/other, measure from account creation as proxy
  if (t.subscription_status === 'cancelled') {
    return Math.max(0, Math.floor((Date.now() - new Date(t.created_at ?? Date.now()).getTime()) / 86_400_000))
  }
  return 0
})

const activePlan = computed(() => plans.find(p => p.id === selectedPlan.value) ?? plans[0])

async function payWithMpesa() {
  if (!mpesaPhone.value || !selectedPlan.value) return
  paying.value = true
  payError.value = ''
  try {
    const res = await apiInitiateMpesaPayment(mpesaPhone.value)
    if (res.success) {
      mpesaSuccess.value = true
    } else {
      payError.value = res.error ?? 'Payment initiation failed'
    }
  } catch (e: unknown) {
    payError.value = (e as Error).message ?? 'Payment failed'
  } finally {
    paying.value = false
  }
}

async function checkActivation() {
  await settingsStore.fetchTenant()
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>
