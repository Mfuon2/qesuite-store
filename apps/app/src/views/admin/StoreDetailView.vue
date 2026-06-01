<template>
  <div class="admin-page space-y-5">
    <!-- Back -->
    <button
      class="flex items-center gap-2 text-slate-500 hover:text-emerald-700 text-sm font-medium transition-colors"
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
          <div class="w-16 h-16 rounded-xl bg-emerald-50"></div>
          <div class="flex-1 space-y-2">
            <div class="h-6 w-48 bg-emerald-50 rounded"></div>
            <div class="h-4 w-32 bg-emerald-50/60 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else-if="stores.currentStore">
      <!-- Store header -->
      <section class="admin-page-hero">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-emerald-50 ring-1 ring-emerald-100">
              <img
                v-if="stores.currentStore.logo_url"
                :src="stores.currentStore.logo_url"
                :alt="stores.currentStore.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-2xl font-black text-emerald-700">
                {{ stores.currentStore.name?.[0] ?? '?' }}
              </div>
            </div>
            <div class="min-w-0">
              <div class="owner-eyebrow">Store profile</div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="owner-title truncate">{{ stores.currentStore.name }}</h1>
                <StatusBadge :status="stores.currentStore.subscription_status" :suspended="stores.currentStore.is_suspended" />
              </div>
              <p class="text-sm font-medium text-slate-500">
                {{ stores.currentStore.slug }}
                &nbsp;·&nbsp;
                <span class="text-slate-700 font-medium capitalize">{{ stores.currentStore.plan }}</span> plan
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
              class="admin-btn-secondary"
              :disabled="actionLoading"
              @click="openResetPassword"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Reset Password
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
      </section>

      <!-- Tabs -->
      <div class="owner-segmented max-w-full overflow-x-auto">
        <nav class="flex gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['owner-segment-button whitespace-nowrap', activeTab === tab.id ? 'owner-segment-button-active' : '']"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="space-y-5">
        <!-- Key metrics (always read-only) -->
        <div class="admin-card p-5">
          <div class="owner-panel-header">
            <div>
              <h2 class="admin-section-title">Key Metrics</h2>
              <p class="admin-section-copy">High-level store performance and subscription details.</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="owner-stat-card flex-col items-start gap-2">
              <p class="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Orders</p>
              <p class="text-2xl font-bold text-slate-950">{{ stores.currentStore.total_orders.toLocaleString() }}</p>
            </div>
            <div class="owner-stat-card flex-col items-start gap-2">
              <p class="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total GMV</p>
              <p class="text-2xl font-bold text-slate-950">KES {{ formatMoney(stores.currentStore.total_gmv) }}</p>
            </div>
            <div class="owner-stat-card flex-col items-start gap-2">
              <p class="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Plan</p>
              <p class="text-2xl font-bold text-slate-950 capitalize">{{ stores.currentStore.plan }}</p>
            </div>
            <div class="owner-stat-card flex-col items-start gap-2">
              <p class="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Member since</p>
              <p class="text-base font-bold text-slate-950">{{ formatDate(stores.currentStore.created_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Profile edit card -->
        <div class="admin-card p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="admin-section-title">Store & Owner Profile</h2>
              <p class="admin-section-copy">Contact, URL, brand, and operational profile.</p>
            </div>
            <button
              v-if="!editingProfile"
              class="admin-btn-secondary text-sm"
              @click="startEdit"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>

          <!-- Read-only view -->
          <div v-if="!editingProfile" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Owner Contact</p>
              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Name</dt>
                  <dd class="text-slate-800 text-sm font-medium">{{ stores.currentStore.owner_name ?? '—' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Phone</dt>
                  <dd class="text-slate-800 text-sm font-medium">{{ stores.currentStore.owner_phone ?? '—' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Email</dt>
                  <dd class="text-slate-800 text-sm font-medium">{{ stores.currentStore.owner_email ?? '—' }}</dd>
                </div>
              </dl>
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Store Details</p>
              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Store name</dt>
                  <dd class="text-slate-800 text-sm font-medium">{{ stores.currentStore.name }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Slug</dt>
                  <dd class="text-slate-800 text-sm font-mono">{{ stores.currentStore.slug }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Address</dt>
                  <dd class="text-slate-800 text-sm font-medium">{{ stores.currentStore.address ?? '—' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 text-sm">Delivery</dt>
                  <dd class="text-sm font-medium" :class="stores.currentStore.delivery_enabled ? 'text-emerald-700' : 'text-slate-500'">
                    {{ stores.currentStore.delivery_enabled ? 'Enabled' : 'Disabled' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Editable form -->
          <form v-else @submit.prevent="saveProfile" class="space-y-5">
            <!-- Owner info -->
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Owner Contact</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Full name</label>
                  <input v-model="profileForm.owner_name" type="text" class="admin-input text-sm" placeholder="Jane Doe" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input v-model="profileForm.owner_phone" type="tel" class="admin-input text-sm" placeholder="+254700000000" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input v-model="profileForm.owner_email" type="email" class="admin-input text-sm" placeholder="owner@store.com" />
                </div>
              </div>
            </div>

            <!-- Store details -->
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Store Details</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Store name</label>
                  <input v-model="profileForm.name" type="text" class="admin-input text-sm" placeholder="My Store" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">
                    URL slug
                    <span v-if="slugError" class="ml-1 text-red-500">— {{ slugError }}</span>
                  </label>
                  <input
                    v-model="profileForm.slug"
                    type="text"
                    class="admin-input font-mono text-sm"
                    :class="slugError ? 'border-red-400' : ''"
                    placeholder="my-store"
                    @input="slugError = ''"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Store phone</label>
                  <input v-model="profileForm.phone" type="tel" class="admin-input text-sm" placeholder="+254700000000" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">WhatsApp number</label>
                  <input v-model="profileForm.whatsapp_number" type="tel" class="admin-input text-sm" placeholder="+254700000000" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                  <input v-model="profileForm.address" type="text" class="admin-input text-sm" placeholder="123 Main St, Nairobi" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select v-model="profileForm.store_category" class="admin-input text-sm">
                    <option v-for="cat in storeCategories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Font</label>
                  <select v-model="profileForm.font_family" class="admin-input text-sm">
                    <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
                  </select>
                </div>
              </div>
            </div>

            <p v-if="profileError" class="text-sm font-semibold text-red-600">{{ profileError }}</p>

            <div class="flex gap-3 pt-1">
              <button type="submit" class="admin-btn-primary" :disabled="profileSaving">
                <svg v-if="profileSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ profileSaving ? 'Saving…' : 'Save Changes' }}
              </button>
              <button type="button" class="admin-btn-secondary" @click="cancelEdit">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Subscription & Billing tab -->
      <div v-else-if="activeTab === 'subscription'">
        <SubscriptionTab :store-id="stores.currentStore.id" />
      </div>

      <!-- Orders tab placeholder -->
      <div v-else-if="activeTab === 'orders'">
        <div class="admin-card p-8 text-center text-slate-500">
          <p>Order history for this store is managed via the store dashboard.</p>
        </div>
      </div>

      <!-- Settings tab placeholder -->
      <div v-else-if="activeTab === 'settings'">
        <div class="admin-card p-8 text-center text-slate-500">
          <p>Store settings can be changed via the store dashboard.</p>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="admin-card p-10 text-center text-slate-500">
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

    <!-- Reset Password Modal -->
    <ResetPasswordModal
      v-if="showResetPasswordModal && stores.currentStore"
      :store-name="stores.currentStore.name"
      :result="resetPasswordResult"
      @confirm="handleResetPassword"
      @cancel="closeResetPassword"
      @done="closeResetPassword"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { formatDate } from '@/composables/useDateFormat'
import { useRoute, useRouter } from 'vue-router'
import { useStoresStore } from '@/stores/stores'
import { useAdminAction } from '@/composables/useAdminAction'
import { updateStoreProfile } from '@/api/admin'
import type { StoreProfileUpdate } from '@/api/admin'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import SuspendModal from '@/components/admin/SuspendModal.vue'
import ExtendTrialModal from '@/components/admin/ExtendTrialModal.vue'
import ResetPasswordModal from '@/components/admin/ResetPasswordModal.vue'
import BillingHistoryTab from '@/components/admin/BillingHistoryTab.vue'
import SubscriptionTab from '@/components/admin/SubscriptionTab.vue'

const route = useRoute()
const router = useRouter()
const stores = useStoresStore()
const { loading: actionLoading, run } = useAdminAction()

const storeId = route.params.id as string
const activeTab = ref('overview')
const showSuspendModal = ref(false)
const showExtendModal = ref(false)
const showResetPasswordModal = ref(false)
const resetPasswordResult = ref<string | undefined>(undefined)

// ── Profile editing ────────────────────────────────────────────
const editingProfile = ref(false)
const profileSaving = ref(false)
const profileError = ref('')
const slugError = ref('')

const storeCategories = [
  { value: 'groceries', label: 'Groceries & Supermarket' },
  { value: 'food', label: 'Food & Restaurants' },
  { value: 'fashion', label: 'Fashion & Clothing' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'pharmacy', label: 'Pharmacy & Health' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'home', label: 'Home & Living' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'other', label: 'Other' },
]

const fonts = ['Inter', 'Poppins', 'DM Sans', 'Nunito']

const profileForm = reactive({
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  name: '',
  slug: '',
  phone: '',
  whatsapp_number: '',
  address: '',
  store_category: 'groceries',
  font_family: 'Poppins',
})

function startEdit() {
  const s = stores.currentStore!
  profileForm.owner_name = s.owner_name ?? ''
  profileForm.owner_phone = s.owner_phone ?? ''
  profileForm.owner_email = s.owner_email ?? ''
  profileForm.name = s.name
  profileForm.slug = s.slug
  profileForm.phone = (s as unknown as Record<string, string>).phone ?? ''
  profileForm.whatsapp_number = (s as unknown as Record<string, string>).whatsapp_number ?? ''
  profileForm.address = s.address ?? ''
  profileForm.store_category = (s as unknown as Record<string, string>).store_category ?? 'groceries'
  profileForm.font_family = (s as unknown as Record<string, string>).font_family ?? 'Poppins'
  profileError.value = ''
  slugError.value = ''
  editingProfile.value = true
}

function cancelEdit() {
  editingProfile.value = false
  profileError.value = ''
  slugError.value = ''
}

async function saveProfile() {
  profileSaving.value = true
  profileError.value = ''
  slugError.value = ''
  try {
    const payload: StoreProfileUpdate = {
      owner_name: profileForm.owner_name || undefined,
      owner_phone: profileForm.owner_phone || undefined,
      owner_email: profileForm.owner_email || undefined,
      name: profileForm.name || undefined,
      slug: profileForm.slug || undefined,
      phone: profileForm.phone || null,
      whatsapp_number: profileForm.whatsapp_number || null,
      address: profileForm.address || null,
      store_category: profileForm.store_category,
      font_family: profileForm.font_family,
    }
    await updateStoreProfile(storeId, payload)
    // Refresh store data from server so the view reflects changes immediately
    await stores.fetchStore(storeId)
    editingProfile.value = false
  } catch (e: unknown) {
    const msg = (e as Error).message ?? 'Failed to save'
    if (msg.toLowerCase().includes('slug')) slugError.value = msg
    else profileError.value = msg
  } finally {
    profileSaving.value = false
  }
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'subscription', label: 'Subscription & Billing' },
  { id: 'orders', label: 'Orders' },
  { id: 'settings', label: 'Settings' },
]

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

function openResetPassword() {
  resetPasswordResult.value = undefined
  showResetPasswordModal.value = true
}

function closeResetPassword() {
  showResetPasswordModal.value = false
  resetPasswordResult.value = undefined
}

async function handleResetPassword(password: string | undefined) {
  await run(
    async () => {
      resetPasswordResult.value = await stores.resetPassword(storeId, password)
    },
    '',
    'Failed to reset password.'
  )
}

onMounted(() => stores.fetchStore(storeId))
</script>
