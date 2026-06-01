<template>
  <div class="owner-page">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <div class="owner-eyebrow">Subscription billing</div>
          <h1 class="owner-title">Billing</h1>
          <p class="owner-subtitle">
            Manage your plan, make subscription payments, and review billing activity for your store.
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current status</p>
          <p class="mt-1 text-sm font-bold capitalize text-slate-800">{{ subscription?.status || 'active' }}</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mt-5 space-y-3">
      <div class="skeleton h-28 rounded-[28px]" />
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in 4" :key="i" class="skeleton h-20 rounded-[22px]" />
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

      <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section class="space-y-5">
          <div class="owner-panel overflow-hidden p-0">
            <div class="relative overflow-hidden p-5 text-white sm:p-6" :style="{ background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 65%, #000))' }">
              <div class="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-14 rounded-full bg-white/10 blur-2xl" />
              <div class="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Current plan</p>
                  <h2 class="mt-2 text-3xl font-black capitalize tracking-tight">{{ subscription?.plan || 'Starter' }}</h2>
                  <p class="mt-1 text-sm font-semibold text-white/75">KES {{ monthlyAmount }} per month</p>
                </div>
                <span :class="['rounded-full px-3 py-1.5 text-xs font-black capitalize ring-1 ring-white/20', planStatusClass]">
                  {{ subscription?.status || 'active' }}
                </span>
              </div>

              <div class="relative mt-6 grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl bg-white/12 p-3 ring-1 ring-white/10">
                  <p class="text-xs font-semibold text-white/60">Currency</p>
                  <p class="mt-1 text-sm font-bold">{{ subscription?.currency || 'KES' }}</p>
                </div>
                <div class="rounded-2xl bg-white/12 p-3 ring-1 ring-white/10">
                  <p class="text-xs font-semibold text-white/60">Payment method</p>
                  <p class="mt-1 text-sm font-bold">{{ paymentMethodLabel(subscription?.payment_method) }}</p>
                </div>
                <div class="rounded-2xl bg-white/12 p-3 ring-1 ring-white/10">
                  <p class="text-xs font-semibold text-white/60">Renews</p>
                  <p class="mt-1 text-sm font-bold">{{ nextBillingDate }}</p>
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

            <div v-if="!history.length" class="owner-empty py-12">
              <DocumentTextIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p class="text-base font-bold text-slate-800">No billing history yet</p>
              <p class="mt-1 text-sm text-slate-500">Successful subscription payments will appear here.</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="item in history"
                :key="item.id"
                class="owner-list-row flex items-center gap-4"
              >
                <div class="owner-brand-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary ring-1">
                  <DocumentTextIcon class="h-5 w-5" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold text-slate-950">{{ item.currency || 'KES' }} {{ item.amount.toLocaleString() }}</p>
                  <p class="truncate text-xs font-medium text-slate-500">
                    {{ paymentMethodLabel(item.payment_method) }} - {{ item.reference || 'No reference' }}
                  </p>
                </div>

                <div class="shrink-0 text-right">
                  <span :class="['rounded-full px-2.5 py-1 text-xs font-bold capitalize', item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
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

        <aside class="xl:sticky xl:top-24 xl:self-start">
          <div class="owner-panel">
            <div class="owner-panel-header">
              <div>
                <h2 class="owner-section-title">Pay subscription</h2>
                <p class="owner-section-copy">Use M-Pesa STK push for the current billing cycle.</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="owner-brand-surface rounded-[24px] border p-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 overflow-hidden rounded-2xl shadow-sm">
                    <img src="/mpesa.png" alt="M-Pesa" class="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-950">M-Pesa</p>
                    <p class="text-xs font-medium text-slate-500">STK push to your phone</p>
                  </div>
                </div>

                <div class="mt-4 flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
                  <input
                    v-model="mpesaPhone"
                    type="tel"
                    placeholder="+254700000000"
                    class="owner-input"
                  />
                  <button
                    @click="payWithMpesa"
                    :disabled="!mpesaPhone || payingMpesa"
                    class="owner-primary-action shrink-0"
                  >
                    <svg v-if="payingMpesa" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Pay
                  </button>
                </div>

                <p v-if="mpesaStatus" class="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                  {{ mpesaStatus }}
                </p>
              </div>

              <div class="rounded-[24px] border border-slate-100 bg-white p-4 opacity-75">
                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <CreditCardIcon class="h-5 w-5" />
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
import { apiGetSubscription, apiGetBillingHistory, apiInitiateMpesaPayment } from '@/api/settings'
import { useToast } from '@/composables/useToast'
import type { PaymentMethod, Subscription, BillingHistory } from '@qesuite/types'

const { showToast } = useToast()
const loading = ref(true)
const subscription = ref<Subscription | null>(null)
const history = ref<BillingHistory[]>([])
const mpesaPhone = ref('')
const payingMpesa = ref(false)
const mpesaStatus = ref('')

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

async function payWithMpesa() {
  if (!mpesaPhone.value) return
  payingMpesa.value = true
  mpesaStatus.value = ''
  try {
    const res = await apiInitiateMpesaPayment(mpesaPhone.value)
    if (res.success) {
      mpesaStatus.value = 'STK push sent. Please check your phone and enter your M-Pesa PIN.'
      showToast('M-Pesa payment initiated', 'success')
    }
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Payment failed', 'error')
  } finally {
    payingMpesa.value = false
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
