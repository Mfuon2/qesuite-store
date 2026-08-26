<template>
  <div class="space-y-3">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="admin-card p-5 animate-pulse">
        <div class="h-4 w-32 bg-slate-100 rounded mb-3" />
        <div class="h-8 w-48 bg-slate-100 rounded" />
      </div>
    </div>

    <template v-else-if="data">
      <!-- ── Subscription Status Card ────────────────────────── -->
      <div class="admin-card p-5">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Current Subscription</p>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xl font-bold text-slate-950 capitalize">{{ data.tenant.plan }} plan</span>
              <span :class="['px-2.5 py-0.5 rounded-full text-xs font-bold', statusClass(data.tenant.subscription_status)]">
                {{ data.tenant.subscription_status.replace('_', ' ') }}
              </span>
            </div>
            <p v-if="data.subscription" class="text-sm text-slate-500 mt-1">
              KES {{ data.subscription.amount.toLocaleString() }} / month
              <template v-if="data.subscription.payment_method">
                · {{ data.subscription.payment_method.replace('_', ' ') }}
              </template>
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-if="canActivate"
              class="admin-btn-primary text-sm"
              :disabled="saving"
              @click="showActivatePanel = true"
            >
              Activate Subscription
            </button>
            <button
              v-if="canRevive"
              class="admin-btn-primary text-sm"
              :disabled="saving"
              @click="handleRevive"
            >
              Revive Subscription
            </button>
            <button
              v-if="canCancel"
              class="admin-btn-danger text-sm"
              :disabled="saving"
              @click="showCancelConfirm = true"
            >
              Cancel Subscription
            </button>
          </div>
        </div>

        <!-- Billing period display -->
        <div v-if="data.subscription" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-xl bg-slate-50 px-3 py-3">
            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Period Start</p>
            <p class="mt-1 text-sm font-semibold text-slate-800">{{ fmtDate(data.subscription.current_period_start) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-3 py-3">
            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Period End</p>
            <p class="mt-1 text-sm font-semibold text-slate-800">{{ fmtDate(data.subscription.current_period_end) }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-3 py-3">
            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Plan</p>
            <p class="mt-1 text-sm font-semibold text-slate-800 capitalize">{{ data.subscription.plan }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-3 py-3">
            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Amount</p>
            <p class="mt-1 text-sm font-semibold text-slate-800">{{ data.subscription.currency }} {{ data.subscription.amount.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- ── Adjust Subscription Days ─────────────────────────── -->
      <div v-if="data.subscription && data.tenant.subscription_status === 'active'" class="admin-card !p-3">
        <div class="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 class="text-sm font-bold text-slate-950">Adjust subscription days</h3>
          <p class="text-[11px] text-slate-400">
            Ends <span class="font-semibold text-slate-700">{{ fmtDate(data.subscription.current_period_end) }}</span>
            <span v-if="daysRemaining !== null" class="ml-1" :class="daysRemaining <= 3 ? 'font-bold text-red-600' : daysRemaining <= 7 ? 'font-semibold text-amber-600' : 'font-semibold text-emerald-600'">
              · {{ daysRemaining }} day{{ daysRemaining !== 1 ? 's' : '' }} left
            </span>
          </p>
        </div>

        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <!-- Add days -->
          <div class="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-2 sm:flex-row sm:items-center">
            <div class="min-w-[106px] shrink-0">
              <p class="text-[11px] font-bold text-emerald-800">Extend</p>
              <p class="text-[10px] font-medium text-emerald-700">New end: {{ previewEnd(adjustAddDays) }}</p>
            </div>
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                aria-label="Remove one day from extension"
                @click="adjustAddDays = Math.max(1, adjustAddDays - 1)"
              >−</button>
              <input
                v-model.number="adjustAddDays"
                type="number"
                min="1"
                max="365"
                class="admin-input !h-8 !w-14 !px-1 text-center text-xs"
              />
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                aria-label="Add one day to extension"
                @click="adjustAddDays++"
              >+</button>
              <button
                class="admin-btn-primary ml-auto min-w-[92px] flex-1 !px-2 sm:flex-none"
                :disabled="saving"
                @click="handleAdjustDays(adjustAddDays)"
              >
                Add {{ adjustAddDays }} day{{ adjustAddDays !== 1 ? 's' : '' }}
              </button>
            </div>
          </div>

          <!-- Reduce days -->
          <div class="flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50/40 p-2 sm:flex-row sm:items-center">
            <div class="min-w-[106px] shrink-0">
              <p class="text-[11px] font-bold text-red-700">Reduce</p>
              <p class="text-[10px] font-medium text-red-600">New end: {{ previewEnd(-adjustRemoveDays) }}</p>
            </div>
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                aria-label="Remove one day from reduction"
                @click="adjustRemoveDays = Math.max(1, adjustRemoveDays - 1)"
              >−</button>
              <input
                v-model.number="adjustRemoveDays"
                type="number"
                min="1"
                max="365"
                class="admin-input !h-8 !w-14 !px-1 text-center text-xs"
              />
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                aria-label="Add one day to reduction"
                @click="adjustRemoveDays++"
              >+</button>
              <button
                class="admin-btn-danger ml-auto min-w-[108px] flex-1 !px-2 sm:flex-none"
                :disabled="saving"
                @click="handleAdjustDays(-adjustRemoveDays)"
              >
                Remove {{ adjustRemoveDays }} day{{ adjustRemoveDays !== 1 ? 's' : '' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Activate Panel ──────────────────────────────────── -->
      <div v-if="showActivatePanel" class="admin-card border-emerald-200 p-5">
        <h3 class="text-sm font-bold text-slate-950 mb-4">Activate Subscription</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Plan</label>
            <QeSelect v-model="activateForm.plan" :options="plans" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Amount (KES)</label>
            <input v-model.number="activateForm.amount" type="number" min="0" class="admin-input text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Period</label>
            <QeSelect v-model="activateForm.period_months" :options="periodMonths" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Payment method</label>
            <QeSelect v-model="activateForm.payment_method" :options="paymentMethods" />
          </div>
        </div>
        <div class="flex gap-2">
          <button class="admin-btn-primary text-sm" :disabled="saving" @click="handleActivate">
            {{ saving ? 'Activating…' : 'Confirm Activation' }}
          </button>
          <button class="admin-btn-secondary text-sm" @click="showActivatePanel = false">Cancel</button>
        </div>
      </div>

      <!-- ── Edit Billing Period ─────────────────────────────── -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-950">Edit Billing Period</h3>
          <button
            class="text-xs font-semibold text-emerald-700 hover:underline"
            @click="showBillingEdit = !showBillingEdit"
          >{{ showBillingEdit ? 'Hide' : 'Edit' }}</button>
        </div>
        <div v-if="showBillingEdit" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Plan</label>
            <QeSelect v-model="billingForm.plan" :options="plans" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Amount (KES)</label>
            <input v-model.number="billingForm.amount" type="number" min="0" class="admin-input text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Payment method</label>
            <QeSelect v-model="billingForm.payment_method" :options="paymentMethods" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Period start</label>
            <QeDatePicker v-model="billingForm.current_period_start" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Period end</label>
            <QeDatePicker v-model="billingForm.current_period_end" />
          </div>
          <div class="flex items-end">
            <button class="admin-btn-primary text-sm w-full" :disabled="saving" @click="handleUpdateBilling">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Trial Management ────────────────────────────────── -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-950">Trial Management</h3>
            <p v-if="data.tenant.trial_ends_at" class="text-xs text-slate-500 mt-0.5">
              Ends {{ fmtDate(data.tenant.trial_ends_at) }}
              <span :class="['ml-1 font-semibold', trialDaysLeft <= 3 ? 'text-red-600' : 'text-amber-600']">
                ({{ trialDaysLeft }} days left)
              </span>
            </p>
            <p v-else class="text-xs text-slate-500 mt-0.5">No active trial</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Enable trial -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p class="text-xs font-bold text-slate-600 mb-2">Start trial</p>
            <div class="flex gap-1.5">
              <input
                v-model.number="trialDays"
                type="number" min="1" max="365"
                class="admin-input text-sm w-20"
                placeholder="14"
              />
              <button
                class="admin-btn-primary flex-1 text-xs"
                :disabled="saving"
                @click="handleTrial('enable')"
              >Enable</button>
            </div>
          </div>

          <!-- Add days -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p class="text-xs font-bold text-slate-600 mb-2">Add days</p>
            <div class="flex gap-1.5">
              <input
                v-model.number="addDays"
                type="number" min="1" max="365"
                class="admin-input text-sm w-20"
                placeholder="7"
              />
              <button
                class="admin-btn-primary flex-1 text-xs"
                :disabled="saving || !data.tenant.trial_ends_at"
                @click="handleTrial('add_days')"
              >Add</button>
            </div>
          </div>

          <!-- Set specific end date -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p class="text-xs font-bold text-slate-600 mb-2">Set end date</p>
            <div class="flex gap-1.5">
              <QeDatePicker v-model="trialEndDate" class="flex-1" />
              <button
                class="admin-btn-primary text-xs px-2"
                :disabled="saving || !trialEndDate"
                @click="handleTrial('set_date')"
              >Set</button>
            </div>
          </div>

          <!-- Disable trial -->
          <div class="rounded-xl border border-red-100 bg-red-50/40 p-3">
            <p class="text-xs font-bold text-red-700 mb-2">Disable trial</p>
            <button
              class="admin-btn-danger w-full text-xs"
              :disabled="saving || !data.tenant.trial_ends_at"
              @click="handleTrial('disable')"
            >Remove Trial</button>
          </div>
        </div>
      </div>

      <!-- ── Record Manual Payment ───────────────────────────── -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-950">Record Payment</h3>
          <button
            class="text-xs font-semibold text-emerald-700 hover:underline"
            @click="showPaymentForm = !showPaymentForm"
          >{{ showPaymentForm ? 'Hide' : '+ Add' }}</button>
        </div>
        <div v-if="showPaymentForm" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Amount (KES)</label>
            <input v-model.number="paymentForm.amount" type="number" min="0" class="admin-input text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <QeSelect v-model="paymentForm.status" :options="paymentStatuses" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Method</label>
            <QeSelect v-model="paymentForm.payment_method" :options="paymentMethods" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 mb-1">Reference / Notes</label>
            <input v-model="paymentForm.reference" type="text" placeholder="e.g. MPesa ref, invoice number…" class="admin-input text-sm" />
          </div>
          <div class="flex items-end">
            <button
              class="admin-btn-primary text-sm w-full"
              :disabled="saving || !paymentForm.amount"
              @click="handleAddPayment"
            >{{ saving ? 'Saving…' : 'Record Payment' }}</button>
          </div>
        </div>
      </div>

      <!-- ── Billing History ─────────────────────────────────── -->
      <div class="admin-table-card overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-950">Billing History</h3>
          <p class="text-xs text-slate-400 mt-0.5">{{ data.billing_history.length }} records</p>
        </div>
        <div v-if="!data.billing_history.length" class="p-8 text-center text-slate-400 text-sm">No billing records yet</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-slate-100">
              <tr>
                <th class="table-th">Date</th>
                <th class="table-th text-right">Amount</th>
                <th class="table-th">Method</th>
                <th class="table-th">Reference</th>
                <th class="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rec in data.billing_history"
                :key="rec.id"
                class="border-b border-slate-100 hover:bg-emerald-50/40 transition-colors"
              >
                <td class="table-td text-slate-600 text-sm">{{ fmtDate(rec.created_at) }}</td>
                <td class="table-td text-right font-semibold text-slate-950">
                  {{ rec.currency }} {{ rec.amount.toLocaleString() }}
                </td>
                <td class="table-td text-slate-600 capitalize text-sm">{{ rec.payment_method?.replace('_', ' ') ?? '—' }}</td>
                <td class="table-td font-mono text-xs text-slate-400">{{ rec.reference ?? '—' }}</td>
                <td class="table-td">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-semibold', payStatusClass(rec.status)]">
                    {{ rec.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Cancel confirm -->
    <ConfirmModal
      v-if="showCancelConfirm"
      title="Cancel subscription?"
      message="The store owner will lose access to paid features at the end of the current billing period."
      confirm-label="Cancel subscription"
      :danger="true"
      @confirm="handleCancel"
      @cancel="showCancelConfirm = false"
    />

    <!-- Toast -->
    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl text-white"
      :class="toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'"
    >
      {{ toast.msg }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { formatDate as fmtDate, formatTime } from '@/composables/useDateFormat'
import { parseAppTimestamp } from '@qesuite/shared'
import { QeSelect, QeDatePicker } from '@qesuite/ui'
import ConfirmModal from './ConfirmModal.vue'
import {
  getStoreSubscription, updateStoreSubscription, activateStoreSubscription,
  cancelStoreSubscription, reviveStoreSubscription, updateStoreTrial,
  addStoreBillingRecord, adjustSubscriptionDays, type StoreSubscriptionOverview,
} from '@/api/admin'

const props = defineProps<{ storeId: string }>()

const plans = [
  { value: 'trial', label: 'Trial' },
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'pro', label: 'Pro' },
]

const paymentMethods = [
  { value: 'manual', label: 'Manual' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
]

const paymentStatuses = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const periodMonths = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
]

const loading = ref(true)
const saving = ref(false)
const data = ref<StoreSubscriptionOverview | null>(null)

// Day-adjustment controls
const adjustAddDays = ref(7)
const adjustRemoveDays = ref(7)

const daysRemaining = computed(() => {
  const end = data.value?.subscription?.current_period_end
  if (!end) return null
  return Math.max(0, Math.ceil((parseAppTimestamp(end).getTime() - Date.now()) / 86_400_000))
})

function previewEnd(days: number): string {
  const end = data.value?.subscription?.current_period_end
  const base = end ? parseAppTimestamp(end) : new Date()
  base.setDate(base.getDate() + days)
  const min = new Date(); min.setHours(0, 0, 0, 0)
  if (base < min) base.setTime(min.getTime())
  return fmtDate(base.toISOString())
}
const showActivatePanel = ref(false)
const showBillingEdit = ref(false)
const showPaymentForm = ref(false)
const showCancelConfirm = ref(false)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)

// ── Form states ────────────────────────────────────────────────
const activateForm = reactive({ plan: 'starter', amount: 999, period_months: 1, payment_method: 'manual' })
const billingForm = reactive({ plan: 'starter', amount: 999, payment_method: 'manual', current_period_start: '', current_period_end: '' })
const paymentForm = reactive({ amount: 999, status: 'paid', payment_method: 'manual', reference: '' })
const trialDays = ref(14)
const addDays = ref(7)
const trialEndDate = ref('')

// ── Computed ───────────────────────────────────────────────────
const canActivate = computed(() => {
  const s = data.value?.tenant.subscription_status
  return s === 'trialing' || s === 'cancelled' || s === 'expired'
})
const canCancel = computed(() => data.value?.tenant.subscription_status === 'active')
const canRevive = computed(() => data.value?.tenant.subscription_status === 'cancelled')

const trialDaysLeft = computed(() => {
  if (!data.value?.tenant.trial_ends_at) return 0
  return Math.max(0, Math.ceil((parseAppTimestamp(data.value.tenant.trial_ends_at).getTime() - Date.now()) / 86400000))
})

// ── Helpers ────────────────────────────────────────────────────

function statusClass(s: string) {
  if (s === 'active') return 'bg-emerald-50 text-emerald-700'
  if (s === 'trialing') return 'bg-amber-50 text-amber-700'
  if (s === 'cancelled') return 'bg-red-50 text-red-700'
  if (s === 'expired') return 'bg-slate-100 text-slate-600'
  return 'bg-slate-100 text-slate-500'
}

function payStatusClass(s: string) {
  if (s === 'paid') return 'bg-emerald-50 text-emerald-700'
  if (s === 'failed') return 'bg-red-50 text-red-700'
  if (s === 'refunded') return 'bg-violet-50 text-violet-700'
  return 'bg-amber-50 text-amber-700'
}

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

async function reload() {
  const fresh = await getStoreSubscription(props.storeId)
  data.value = fresh
  // Sync billing edit form with latest subscription
  if (fresh.subscription) {
    billingForm.plan = fresh.subscription.plan
    billingForm.amount = fresh.subscription.amount
    billingForm.payment_method = fresh.subscription.payment_method ?? 'manual'
    billingForm.current_period_start = fresh.subscription.current_period_start?.substring(0, 10) ?? ''
    billingForm.current_period_end = fresh.subscription.current_period_end?.substring(0, 10) ?? ''
  }
}

// ── Actions ────────────────────────────────────────────────────
async function handleAdjustDays(days: number) {
  saving.value = true
  try {
    await adjustSubscriptionDays(props.storeId, days)
    await reload()
    showToast(`Subscription ${days > 0 ? 'extended' : 'reduced'} by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`)
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

async function handleActivate() {
  saving.value = true
  try {
    await activateStoreSubscription(props.storeId, activateForm)
    showActivatePanel.value = false
    await reload()
    showToast('Subscription activated')
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

async function handleCancel() {
  showCancelConfirm.value = false
  saving.value = true
  try {
    await cancelStoreSubscription(props.storeId)
    await reload()
    showToast('Subscription cancelled')
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

async function handleRevive() {
  saving.value = true
  try {
    await reviveStoreSubscription(props.storeId)
    await reload()
    showToast('Subscription revived')
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

async function handleUpdateBilling() {
  saving.value = true
  try {
    await updateStoreSubscription(props.storeId, {
      plan: billingForm.plan,
      amount: billingForm.amount,
      payment_method: billingForm.payment_method,
      current_period_start: billingForm.current_period_start || undefined,
      current_period_end: billingForm.current_period_end || undefined,
    })
    showBillingEdit.value = false
    await reload()
    showToast('Billing period saved')
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

async function handleTrial(action: 'enable' | 'disable' | 'set_date' | 'add_days') {
  saving.value = true
  try {
    await updateStoreTrial(props.storeId, {
      action,
      days: action === 'enable' ? trialDays.value : action === 'add_days' ? addDays.value : undefined,
      trial_end_date: action === 'set_date' ? trialEndDate.value : undefined,
    })
    await reload()
    const msgs: Record<string, string> = {
      enable: 'Trial enabled', disable: 'Trial removed',
      set_date: 'Trial end date updated', add_days: `${addDays.value} days added to trial`,
    }
    showToast(msgs[action])
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

async function handleAddPayment() {
  saving.value = true
  try {
    await addStoreBillingRecord(props.storeId, {
      amount: paymentForm.amount,
      status: paymentForm.status,
      payment_method: paymentForm.payment_method,
      reference: paymentForm.reference || undefined,
    })
    paymentForm.amount = 999
    paymentForm.reference = ''
    showPaymentForm.value = false
    await reload()
    showToast('Payment recorded')
  } catch (e: unknown) {
    showToast((e as Error).message, 'error')
  } finally { saving.value = false }
}

onMounted(async () => {
  loading.value = true
  try { await reload() } finally { loading.value = false }
})
</script>
