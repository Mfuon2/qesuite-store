<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Subscriptions</h1>
          <p class="owner-subtitle">
            Manage your plan, make subscription payments, and review billing activity for your store.
          </p>
        </div>

        <div class="self-start rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
          <p class="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
          <p class="mt-0.5 text-xs font-bold capitalize text-slate-800">{{ subscription?.status || 'active' }}</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mt-3 space-y-2">
      <div class="skeleton h-20 rounded-2xl" />
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in 4" :key="i" class="skeleton h-16 rounded-2xl" />
      </div>
      <div class="skeleton h-64 rounded-[28px]" />
    </div>

    <template v-else>
      <section class="owner-stat-grid">
        <div class="owner-stat-card">
          <div class="owner-stat-icon">
            <CreditCardIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-bold capitalize text-slate-950">{{ subscription?.plan || 'Starter' }}</p>
            <p class="text-xs font-medium text-slate-500">Current plan</p>
          </div>
        </div>

        <div class="owner-stat-card">
          <div class="owner-stat-icon">
            <BanknotesIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-bold text-slate-950">KES {{ monthlyAmount }}</p>
            <p class="text-xs font-medium text-slate-500">Monthly amount</p>
          </div>
        </div>

        <div class="owner-stat-card">
          <div class="owner-stat-icon bg-sky-50 text-sky-700 ring-sky-100">
            <CalendarDaysIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-bold text-slate-950">{{ nextBillingDate }}</p>
            <p class="text-xs font-medium text-slate-500">Next billing date</p>
          </div>
        </div>

        <div class="owner-stat-card">
          <div class="owner-stat-icon bg-violet-50 text-violet-700 ring-violet-100">
            <DocumentTextIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-bold text-slate-950">{{ history.length }}</p>
            <p class="text-xs font-medium text-slate-500">Billing records</p>
          </div>
        </div>
      </section>

      <div class="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section class="space-y-3">
          <div class="owner-panel overflow-hidden p-0">
            <div class="relative overflow-hidden p-3.5 text-white sm:p-4" :style="{ background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 65%, #000))' }">
              <div class="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-14 rounded-full bg-white/10 blur-2xl" />
              <div class="relative flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Current plan</p>
                  <h2 class="mt-1 text-xl font-black capitalize tracking-tight sm:text-2xl">{{ subscription?.plan || 'Starter' }}</h2>
                  <p class="mt-0.5 text-xs font-semibold text-white/75">KES {{ monthlyAmount }} / month</p>
                </div>
                <span :class="['rounded-full px-2 py-1 text-[10px] font-black capitalize ring-1 ring-white/20', planStatusClass]">
                  {{ subscription?.status || 'active' }}
                </span>
              </div>

              <div class="relative mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
                <div class="min-w-0 rounded-xl bg-white/12 p-2 ring-1 ring-white/10">
                  <p class="truncate text-[9px] font-semibold text-white/60">Currency</p>
                  <p class="mt-0.5 truncate text-xs font-bold">{{ subscription?.currency || 'KES' }}</p>
                </div>
                <div class="min-w-0 rounded-xl bg-white/12 p-2 ring-1 ring-white/10">
                  <p class="truncate text-[9px] font-semibold text-white/60">Payment</p>
                  <p class="mt-0.5 truncate text-xs font-bold">{{ paymentMethodLabel(subscription?.payment_method) }}</p>
                </div>
                <div class="min-w-0 rounded-xl bg-white/12 p-2 ring-1 ring-white/10">
                  <p class="truncate text-[9px] font-semibold text-white/60">Renews</p>
                  <p class="mt-0.5 truncate text-xs font-bold">{{ nextBillingDate }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="owner-panel">
            <div class="owner-panel-header">
              <div>
                <h2 class="owner-section-title">Billing history</h2>
                <p class="owner-section-copy">Recent subscription payments and references.</p>
              </div>
              <span class="owner-brand-surface rounded-full px-3 py-1 text-xs font-bold text-primary">{{ history.length }} records</span>
            </div>

            <div v-if="!history.length" class="owner-empty !py-7">
              <DocumentTextIcon class="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p class="text-sm font-bold text-slate-800">No billing history yet</p>
              <p class="mt-0.5 text-xs text-slate-500">Submitted payments will appear here.</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="item in history"
                :key="item.id"
                class="owner-list-row flex items-center gap-2.5"
              >
                <div class="owner-brand-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary ring-1">
                  <DocumentTextIcon class="h-4 w-4" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold text-slate-950">{{ item.currency || 'KES' }} {{ item.amount.toLocaleString() }}</p>
                  <p class="truncate text-xs font-medium text-slate-500">
                    {{ paymentMethodLabel(item.payment_method) }} - {{ item.reference || 'No reference' }}
                  </p>
                </div>

                <div class="shrink-0 text-right">
                  <span :class="['rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', billingStatusClass(item.status)]">
                    {{ item.status }}
                  </span>
                  <p class="mt-1 text-xs font-medium text-slate-400">
                    {{ item.paid_at ? formatDate(item.paid_at) : formatDate(item.created_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside v-if="accessStore.can('subscriptions.manage')" class="xl:sticky xl:top-24 xl:self-start">
          <div class="owner-panel">
            <div class="owner-panel-header">
              <div>
                <h2 class="owner-section-title">Pay subscription</h2>
                <p class="owner-section-copy">Already paid? Enter the transaction code from your M-Pesa message.</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="owner-brand-surface rounded-2xl border p-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 overflow-hidden rounded-xl shadow-sm">
                    <img src="/mpesa.png" alt="M-Pesa" class="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-950">M-Pesa transaction code</p>
                    <p class="text-xs font-medium text-slate-500">We verify the payment before updating your plan</p>
                  </div>
                </div>

                <div class="mt-3 flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
                  <input
                    v-model="mpesaReference"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    autocapitalize="characters"
                    maxlength="20"
                    placeholder="e.g. TQH7ABC123"
                    class="owner-input"
                    @input="normaliseMpesaReference"
                  />
                  <button
                    @click="submitMpesaReference"
                    :disabled="!canSubmitReference || submittingReference"
                    class="owner-primary-action shrink-0"
                  >
                    <svg v-if="submittingReference" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submit reference
                  </button>
                </div>

                <p class="mt-2 text-[11px] font-medium leading-4 text-slate-500">
                  Find the transaction code near the start of your M-Pesa confirmation SMS. Each code can be used once.
                </p>

                <p v-if="referenceStatus" class="mt-2 rounded-xl bg-white px-2.5 py-2 text-[11px] font-semibold leading-4 text-emerald-700">
                  {{ referenceStatus }}
                </p>
              </div>

              <div class="rounded-2xl border border-slate-100 bg-white p-3 opacity-75">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <CreditCardIcon class="h-4 w-4" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-950">Credit / debit card</p>
                    <p class="text-xs font-medium text-slate-500">Powered by Stripe, coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatDate } from '@/composables/useDateFormat'
import { BanknotesIcon, CalendarDaysIcon, CreditCardIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { apiGetSubscription, apiGetBillingHistory, apiSubmitMpesaReference } from '@/api/settings'
import { useToast } from '@/composables/useToast'
import type { PaymentMethod, Subscription, BillingHistory } from '@qesuite/types'
import { useAccessStore } from '@/stores/access'

const { showToast } = useToast()
const accessStore = useAccessStore()
const loading = ref(true)
const subscription = ref<Subscription | null>(null)
const history = ref<BillingHistory[]>([])
const mpesaReference = ref('')
const submittingReference = ref(false)
const referenceStatus = ref('')
const canSubmitReference = computed(() => /^[A-Z0-9]{8,20}$/.test(mpesaReference.value))

const monthlyAmount = computed(() => (subscription.value?.amount || 999).toLocaleString())
const nextBillingDate = computed(() => {
  if (!subscription.value?.current_period_end) return 'Not set'
  return formatDate(subscription.value.current_period_end)
})

const planStatusClass = computed(() => {
  const status = subscription.value?.status
  if (status === 'active') return 'bg-white/18 text-white'
  if (status === 'trialing') return 'bg-amber-300/30 text-white'
  if (status === 'past_due') return 'bg-red-400/30 text-white'
  return 'bg-white/18 text-white'
})

function paymentMethodLabel(method?: PaymentMethod | null) {
  if (method === 'mpesa') return 'M-Pesa'
  if (method === 'stripe') return 'Card'
  if (method === 'pay_on_delivery') return 'Pay on delivery'
  return 'Not set'
}

function billingStatusClass(status: string) {
  if (status === 'paid') return 'bg-green-100 text-green-700'
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function normaliseMpesaReference(event: Event) {
  const input = event.target as HTMLInputElement
  mpesaReference.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
}

async function submitMpesaReference() {
  if (!canSubmitReference.value) return
  submittingReference.value = true
  referenceStatus.value = ''
  try {
    const res = await apiSubmitMpesaReference(mpesaReference.value)
    if (res.success) {
      referenceStatus.value = 'Reference submitted. We will verify it before updating your subscription.'
      mpesaReference.value = ''
      const historyRes = await apiGetBillingHistory()
      if (historyRes.success) history.value = historyRes.data || []
      showToast('M-Pesa reference submitted', 'success')
    }
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Could not submit reference', 'error')
  } finally {
    submittingReference.value = false
  }
}

onMounted(async () => {
  try {
    const [subRes, histRes] = await Promise.allSettled([
      apiGetSubscription(),
      apiGetBillingHistory()
    ])
    if (subRes.status === 'fulfilled' && subRes.value.success) subscription.value = subRes.value.data || null
    if (histRes.status === 'fulfilled' && histRes.value.success) history.value = histRes.value.data || []
  } finally {
    loading.value = false
  }
})
</script>
