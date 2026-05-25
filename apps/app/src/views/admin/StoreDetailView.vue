<template>
  <div class="p-4 space-y-4">
    <!-- Back -->
    <button
      class="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm font-medium transition-colors"
      @click="router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to stores
    </button>

    <!-- Loading state -->
    <div v-if="stores.detailLoading" class="space-y-4">
      <div class="admin-card p-6 animate-pulse">
        <div class="flex gap-4">
          <div class="w-16 h-16 rounded-xl bg-slate-700"></div>
          <div class="flex-1 space-y-2">
            <div class="h-6 w-48 bg-slate-700 rounded"></div>
            <div class="h-4 w-32 bg-slate-700/60 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else-if="stores.currentStore">
      <!-- Store header -->
      <div class="admin-card p-4">
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
              <img
                v-if="stores.currentStore.logo_url"
                :src="stores.currentStore.logo_url"
                :alt="stores.currentStore.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                {{ stores.currentStore.name?.[0] ?? '?' }}
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold text-white">{{ stores.currentStore.name }}</h1>
                <StatusBadge :status="stores.currentStore.subscription_status" :suspended="stores.currentStore.is_suspended" />
              </div>
              <p class="text-slate-400 text-sm mt-0.5">
                {{ stores.currentStore.slug }}
                &nbsp;·&nbsp;
                <span class="text-slate-300 font-medium capitalize">{{ stores.currentStore.plan }}</span> plan
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 flex-wrap">
            <button
              class="admin-btn-secondary"
              @click="handleImpersonate"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Impersonate
            </button>
            <button
              v-if="stores.currentStore.trial_ends_at"
              class="admin-btn-secondary"
              @click="showExtendModal = true"
            >
              Extend Trial
            </button>
            <button
              v-if="stores.currentStore.is_suspended"
              class="admin-btn-primary"
              :disabled="actionLoading"
              @click="handleUnsuspend"
            >
              Unsuspend
            </button>
            <button
              v-else
              class="admin-btn-danger"
              :disabled="actionLoading"
              @click="showSuspendModal = true"
            >
              Suspend
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-slate-700">
        <nav class="flex gap-0 -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.id
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Owner contact -->
        <div class="admin-card p-5">
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Owner Contact</h2>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Name</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ stores.currentStore.owner_name ?? '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Phone</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ stores.currentStore.owner_phone ?? '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Email</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ stores.currentStore.owner_email ?? '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Store info -->
        <div class="admin-card p-5">
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Store Info</h2>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Created</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ formatDate(stores.currentStore.created_at) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Currency</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ stores.currentStore.currency }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Delivery</dt>
              <dd class="text-sm font-medium" :class="stores.currentStore.delivery_enabled ? 'text-emerald-400' : 'text-slate-500'">
                {{ stores.currentStore.delivery_enabled ? 'Enabled' : 'Disabled' }}
              </dd>
            </div>
            <div v-if="stores.currentStore.trial_ends_at" class="flex justify-between">
              <dt class="text-slate-400 text-sm">Trial ends</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ formatDate(stores.currentStore.trial_ends_at) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400 text-sm">Address</dt>
              <dd class="text-slate-200 text-sm font-medium">{{ stores.currentStore.address ?? '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Key metrics -->
        <div class="admin-card p-5 md:col-span-2">
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Metrics</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-slate-700/50 rounded-xl p-4">
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Orders</p>
              <p class="text-2xl font-bold text-white">{{ stores.currentStore.total_orders.toLocaleString() }}</p>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-4">
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total GMV</p>
              <p class="text-2xl font-bold text-white">KES {{ formatMoney(stores.currentStore.total_gmv) }}</p>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-4">
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Plan</p>
              <p class="text-2xl font-bold text-white capitalize">{{ stores.currentStore.plan }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing History tab -->
      <div v-else-if="activeTab === 'billing'">
        <BillingHistoryTab :store-id="stores.currentStore.id" />
      </div>

      <!-- Orders tab placeholder -->
      <div v-else-if="activeTab === 'orders'">
        <div class="admin-card p-8 text-center text-slate-400">
          <p>Order history for this store is managed via the store dashboard.</p>
        </div>
      </div>

      <!-- Settings tab placeholder -->
      <div v-else-if="activeTab === 'settings'">
        <div class="admin-card p-8 text-center text-slate-400">
          <p>Store settings can be changed via the store dashboard.</p>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="admin-card p-10 text-center text-slate-400">
      Store not found.
    </div>

    <!-- Suspend Modal -->
    <SuspendModal
      v-if="showSuspendModal && stores.currentStore"
      :store-name="stores.currentStore.name"
      @confirm="handleSuspend"
      @cancel="showSuspendModal = false"
    />

    <!-- Extend Trial Modal -->
    <ExtendTrialModal
      v-if="showExtendModal && stores.currentStore"
      :store-name="stores.currentStore.name"
      @confirm="handleExtend"
      @cancel="showExtendModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStoresStore } from '@/stores/stores'
import { useAdminAction } from '@/composables/useAdminAction'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import SuspendModal from '@/components/admin/SuspendModal.vue'
import ExtendTrialModal from '@/components/admin/ExtendTrialModal.vue'
import BillingHistoryTab from '@/components/admin/BillingHistoryTab.vue'

const route = useRoute()
const router = useRouter()
const stores = useStoresStore()
const { loading: actionLoading, run } = useAdminAction()

const storeId = route.params.id as string
const activeTab = ref('overview')
const showSuspendModal = ref(false)
const showExtendModal = ref(false)

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'billing', label: 'Billing History' },
  { id: 'settings', label: 'Settings' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

async function handleSuspend(reason: string) {
  showSuspendModal.value = false
  await run(
    () => stores.suspend(storeId, reason),
    'Store suspended.',
    'Failed to suspend store.'
  )
}

async function handleUnsuspend() {
  await run(
    () => stores.unsuspend(storeId),
    'Store reactivated.',
    'Failed to unsuspend store.'
  )
}

async function handleExtend(days: number) {
  showExtendModal.value = false
  await run(
    () => stores.extend(storeId, days),
    `Trial extended by ${days} days.`,
    'Failed to extend trial.'
  )
}

async function handleImpersonate() {
  await run(
    async () => {
      const token = await stores.impersonate(storeId)
      await navigator.clipboard.writeText(token)
    },
    'Impersonation token copied to clipboard.',
    'Failed to generate impersonation token.'
  )
}

onMounted(() => stores.fetchStore(storeId))
</script>
