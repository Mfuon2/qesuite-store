<template>
  <div class="p-3 sm:p-4 max-w-3xl mx-auto">
    <h2 class="text-base font-bold text-gray-900 dark:text-white mb-3">Billing</h2>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="skeleton h-28 rounded-xl" />
      <div class="skeleton h-20 rounded-xl" />
      <div class="skeleton h-36 rounded-xl" />
    </div>

    <template v-else>
      <!-- Current plan -->
      <div class="bg-gradient-to-br from-primary to-accent rounded-xl p-4 text-white mb-3 shadow-lg shadow-primary/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-white/70 mb-0.5">Current Plan</p>
            <h3 class="text-xl font-bold capitalize">{{ subscription?.plan || 'Starter' }}</h3>
            <p class="text-white/80 text-xs mt-0.5">
              KES {{ subscription?.amount?.toLocaleString() || '999' }} / month
            </p>
          </div>
          <div>
            <span :class="['px-3 py-1.5 rounded-full text-xs font-semibold', statusClass]">
              {{ subscription?.status || 'active' }}
            </span>
          </div>
        </div>
        <div v-if="subscription?.current_period_end" class="mt-4 pt-4 border-t border-white/20">
          <p class="text-white/70 text-xs">Next billing date</p>
          <p class="text-white font-semibold">{{ formatDate(subscription.current_period_end) }}</p>
        </div>
      </div>

      <!-- Payment methods -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Pay for Subscription</h3>
        <div class="space-y-3">
          <!-- M-Pesa -->
          <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <span class="text-green-600 font-bold text-xs">M-PESA</span>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">M-Pesa</p>
                <p class="text-xs text-gray-400">STK Push to your phone</p>
              </div>
            </div>
            <div class="flex gap-2">
              <input
                v-model="mpesaPhone"
                type="tel"
                placeholder="+254700000000"
                class="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button
                @click="payWithMpesa"
                :disabled="!mpesaPhone || payingMpesa"
                class="px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                <svg v-if="payingMpesa" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Pay
              </button>
            </div>
            <p v-if="mpesaStatus" class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ mpesaStatus }}</p>
          </div>

          <!-- Stripe card -->
          <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4 opacity-60">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <CreditCardIcon class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">Credit / Debit Card</p>
                <p class="text-xs text-gray-400">Powered by Stripe — coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing history -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Billing History</h3>
        </div>
        <div v-if="!history.length" class="text-center py-12 text-gray-400 dark:text-gray-500">
          <DocumentTextIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p class="text-sm">No billing history yet</p>
        </div>
        <div v-else class="divide-y divide-gray-50 dark:divide-gray-700">
          <div
            v-for="item in history"
            :key="item.id"
            class="flex items-center gap-4 px-5 py-3"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                KES {{ item.amount.toLocaleString() }}
              </p>
              <p class="text-xs text-gray-400">{{ item.payment_method === 'mpesa' ? 'M-Pesa' : 'Card' }} · {{ item.reference }}</p>
            </div>
            <div class="text-right">
              <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', item.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400']">
                {{ item.status }}
              </span>
              <p class="text-xs text-gray-400 mt-0.5">{{ item.paid_at ? formatDate(item.paid_at) : formatDate(item.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CreditCardIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { apiGetSubscription, apiGetBillingHistory, apiInitiateMpesaPayment } from '@/api/settings'
import { useToast } from '@/composables/useToast'
import type { Subscription, BillingHistory } from '@qesuite/types'

const { showToast } = useToast()
const loading = ref(true)
const subscription = ref<Subscription | null>(null)
const history = ref<BillingHistory[]>([])
const mpesaPhone = ref('')
const payingMpesa = ref(false)
const mpesaStatus = ref('')

const statusClass = computed(() => {
  const s = subscription.value?.status
  if (s === 'active') return 'bg-white/20 text-white'
  if (s === 'trialing') return 'bg-yellow-400/30 text-white'
  if (s === 'past_due') return 'bg-red-400/30 text-white'
  return 'bg-white/20 text-white'
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' })
}

async function payWithMpesa() {
  if (!mpesaPhone.value) return
  payingMpesa.value = true
  mpesaStatus.value = ''
  try {
    const res = await apiInitiateMpesaPayment(mpesaPhone.value)
    if (res.success) {
      mpesaStatus.value = 'STK Push sent! Please check your phone and enter your M-Pesa PIN.'
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
