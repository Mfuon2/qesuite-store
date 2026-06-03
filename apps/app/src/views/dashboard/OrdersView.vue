<template>
  <div class="owner-page">

    <!-- ── Header bar ─────────────────────────────────────────────────── -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <h1 class="text-lg font-extrabold text-slate-950 shrink-0">Orders</h1>
        <RealTimeIndicator :status="realtimeStatus" />
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <!-- Search (list mode only) -->
        <div v-if="isListView" class="relative">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search customer, order…"
            class="h-8 w-44 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            @input="onSearch"
          />
        </div>

        <!-- Payment filter (list mode only) -->
        <div v-if="isListView" class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            v-for="f in PAYMENT_FILTERS"
            :key="f.value"
            @click="setPayment(f.value)"
            :class="['rounded-lg px-3 py-1.5 text-xs font-bold transition',
              paymentFilter === f.value
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50']"
          >{{ f.label }}</button>
        </div>

        <!-- View toggle -->
        <div class="owner-segmented flex">
          <button
            @click="settingsStore.setOrderView('kanban')"
            :class="['owner-segment-button', !isListView ? 'owner-segment-button-active' : '']"
            title="Kanban view"
          >
            <ViewColumnsIcon class="h-4 w-4" />
          </button>
          <button
            @click="settingsStore.setOrderView('list')"
            :class="['owner-segment-button', isListView ? 'owner-segment-button-active' : '']"
            title="List view"
          >
            <ListBulletIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Sound toggle -->
        <button
          @click="settingsStore.toggleSound()"
          :class="['grid h-8 w-8 place-items-center rounded-xl border transition',
            settingsStore.soundEnabled
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600']"
          :title="settingsStore.soundEnabled ? 'Mute order sounds' : 'Enable sounds'"
        >
          <SpeakerWaveIcon v-if="settingsStore.soundEnabled" class="h-4 w-4" />
          <SpeakerXMarkIcon v-else class="h-4 w-4" />
        </button>

        <!-- Refresh -->
        <button
          @click="refresh()"
          class="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition"
          title="Refresh"
        >
          <ArrowPathIcon :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
        </button>
      </div>
    </div>

    <!-- ── Status filter tabs (list mode only) ───────────────────────── -->
    <div v-if="isListView" class="mb-4 flex flex-wrap gap-1.5">
      <button
        v-for="tab in STATUS_TABS"
        :key="tab.value"
        @click="setStatus(tab.value)"
        :class="['flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition',
          statusFilter === tab.value
            ? 'bg-primary text-white shadow-sm'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary']"
      >
        <span :class="['h-1.5 w-1.5 rounded-full', tab.dot]" />
        {{ tab.label }}
        <span
          v-if="tabCounts[tab.value]"
          :class="['rounded-full px-1.5 text-[10px] font-black',
            statusFilter === tab.value ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500']"
        >{{ tabCounts[tab.value] }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- KANBAN VIEW                                                     -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <template v-if="!isListView">
      <!-- Kanban skeletons -->
      <div class="overflow-x-auto pb-2">
      <div v-if="loading" class="flex gap-3 min-w-max">
        <div v-for="i in 7" :key="i" class="owner-panel w-56 shrink-0 p-3 space-y-2">
          <div class="skeleton h-4 w-24 rounded mb-3" />
          <div v-for="j in 3" :key="j" class="skeleton h-28 rounded-[18px]" />
        </div>
      </div>

      <!-- Kanban columns -->
      <div v-else class="flex gap-3 min-w-max">
        <div
          v-for="col in KANBAN_COLS"
          :key="col.status"
          class="owner-panel w-56 shrink-0 p-3"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span :class="['h-2.5 w-2.5 shrink-0 rounded-full', col.dot]" />
              <h3 class="text-sm font-bold text-slate-800">{{ col.label }}</h3>
            </div>
            <span class="rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
              {{ kanbanByStatus[col.status]?.length || 0 }}
            </span>
          </div>
          <div class="min-h-[90px] space-y-2">
            <OrderCard
              v-for="order in kanbanByStatus[col.status] || []"
              :key="order.id"
              :order="order"
              view-mode="kanban"
              @status-changed="handleKanbanStatus"
              @view-detail="goToDetail(order.id)"
            />
            <div
              v-if="!kanbanByStatus[col.status]?.length"
              class="flex h-20 items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/60"
            >
              <p class="text-xs font-semibold text-slate-400">No orders</p>
            </div>
          </div>
        </div>
      </div>
      </div><!-- /overflow-x-auto -->
    </template>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- LIST VIEW                                                       -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-else class="owner-panel overflow-hidden p-0">

      <!-- Column headers -->
      <div
        v-if="!loading && rows.length"
        class="hidden sm:grid grid-cols-[auto_1fr_minmax(100px,18%)_minmax(90px,14%)_minmax(90px,14%)_auto_auto] items-center gap-x-3 border-b border-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"
      >
        <span class="w-6" />
        <span>Order / Customer</span>
        <span>Items</span>
        <span>Payment</span>
        <span class="text-right">Total</span>
        <span class="text-right">Time</span>
        <span class="w-24 text-right">Action</span>
      </div>

      <!-- Skeletons -->
      <div v-if="loading" class="divide-y divide-slate-100">
        <div
          v-for="i in limit"
          :key="i"
          class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3"
        >
          <div class="skeleton h-6 w-6 rounded-full" />
          <div class="space-y-1.5">
            <div class="skeleton h-2.5 w-36 rounded" />
            <div class="skeleton h-2.5 w-24 rounded" />
          </div>
          <div class="skeleton h-5 w-16 rounded-full" />
          <div class="skeleton h-7 w-20 rounded-lg" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!rows.length" class="flex flex-col items-center py-14 text-center">
        <ShoppingCartIcon class="mb-3 h-10 w-10 text-slate-300" />
        <p class="text-sm font-bold text-slate-700">No orders found</p>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ hasFilters ? 'Try clearing the filters.' : 'Orders will appear here when customers place them.' }}
        </p>
        <button v-if="hasFilters" @click="clearFilters" class="owner-secondary-action mt-3 text-xs">
          Clear filters
        </button>
      </div>

      <!-- Rows -->
      <div v-else class="divide-y divide-slate-100/80">
        <div
          v-for="order in rows"
          :key="order.id"
          class="group grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_minmax(100px,18%)_minmax(90px,14%)_minmax(90px,14%)_auto_auto] items-center gap-x-3 px-4 py-3 transition hover:bg-slate-50/70 cursor-pointer"
          @click="goToDetail(order.id)"
        >
          <span :class="['h-2 w-2 shrink-0 rounded-full', statusDot(order.status)]" />

          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-600 font-mono">#{{ order.tracking_code }}</span>
              <StatusBadge :status="order.status" size="xs" />
            </div>
            <p class="mt-0.5 truncate text-xs font-semibold text-slate-700">
              {{ order.customer_name || order.customer_phone }}
            </p>
            <p class="truncate text-[11px] text-slate-400 font-mono sm:hidden">{{ order.customer_phone }}</p>
          </div>

          <p class="hidden sm:block truncate text-xs text-slate-500">{{ order.items_summary || '—' }}</p>

          <div class="hidden sm:flex items-center gap-1.5">
            <span :class="['rounded-full px-2 py-0.5 text-[10px] font-black',
              order.payment_status === 'paid'   ? 'bg-emerald-50 text-emerald-700' :
              order.payment_status === 'failed' ? 'bg-red-50 text-red-700' :
                                                  'bg-amber-50 text-amber-700']">
              {{ order.payment_status }}
            </span>
            <span class="text-[10px] text-slate-400">{{ paymentLabel(order.payment_method) }}</span>
          </div>

          <p class="hidden sm:block text-right text-sm font-bold text-primary whitespace-nowrap">
            KES {{ order.total.toLocaleString() }}
          </p>

          <p class="text-right text-[11px] text-slate-400 whitespace-nowrap">
            {{ timeAgo(order.created_at) }}
          </p>

          <div class="flex items-center justify-end gap-1" @click.stop>
            <a
              :href="`tel:${order.customer_phone}`"
              class="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Call"
            >
              <PhoneIcon class="h-3.5 w-3.5" />
            </a>
            <button
              v-if="nextAction(order.status)"
              :disabled="advancing === order.id"
              @click="advance(order)"
              :class="['flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition active:scale-95 whitespace-nowrap',
                nextAction(order.status)!.cls]"
            >
              <span v-if="advancing === order.id" class="h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
              {{ advancing === order.id ? '…' : nextAction(order.status)!.label }}
            </button>
            <button
              class="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="View detail"
            >
              <ChevronRightIcon class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination footer -->
      <div class="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <p class="text-xs font-medium text-slate-400">{{ rangeLabel }}</p>
        <div class="flex items-center gap-0.5">
          <button
            :disabled="currentPage <= 1"
            class="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            @click="goTo(currentPage - 1)"
          ><ChevronLeftIcon class="h-3.5 w-3.5" /></button>

          <template v-for="pg in pageNumbers" :key="pg">
            <span v-if="pg === -1" class="px-1 text-slate-400 text-xs">…</span>
            <button
              v-else
              @click="goTo(pg)"
              :class="['h-7 min-w-[1.75rem] rounded-lg px-1.5 text-xs font-bold transition',
                pg === currentPage ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100']"
            >{{ pg }}</button>
          </template>

          <button
            :disabled="currentPage >= totalPages"
            class="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            @click="goTo(currentPage + 1)"
          ><ChevronRightIcon class="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
  PhoneIcon, ShoppingCartIcon, ChevronLeftIcon, ChevronRightIcon,
  ViewColumnsIcon, ListBulletIcon,
} from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import OrderCard from '@/components/dashboard/OrderCard.vue'
import RealTimeIndicator from '@/components/dashboard/RealTimeIndicator.vue'
import { timeAgo } from '@/composables/useDateFormat'
import { apiFetch } from '@/api/index'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useRealtime } from '@/composables/useRealtime'
import type { Order, OrderStatus } from '@qesuite/types'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// ── Types ──────────────────────────────────────────────────────
interface OrderRow {
  id: string
  tracking_code: string
  status: OrderStatus
  payment_method: string | null
  payment_status: string
  customer_name: string | null
  customer_phone: string
  subtotal: number
  delivery_fee: number
  total: number
  items_summary: string | null
  created_at: string
  updated_at: string
}
interface Meta { total: number; page: number; limit: number; total_pages: number }

// ── Constants ──────────────────────────────────────────────────
const STATUS_TABS = [
  { value: '',                 label: 'All',              dot: 'bg-slate-400' },
  { value: 'NEW',              label: 'New',              dot: 'bg-blue-500' },
  { value: 'CONFIRMED',        label: 'Confirmed',        dot: 'bg-indigo-500' },
  { value: 'PREPARING',        label: 'Preparing',        dot: 'bg-amber-500' },
  { value: 'READY',            label: 'Ready',            dot: 'bg-emerald-500' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', dot: 'bg-teal-500' },
  { value: 'DELIVERED',        label: 'Delivered',        dot: 'bg-green-600' },
  { value: 'CANCELLED',        label: 'Cancelled',        dot: 'bg-red-400' },
] as const

const KANBAN_COLS = [
  { status: 'NEW' as OrderStatus,              label: 'New',              dot: 'bg-blue-500' },
  { status: 'CONFIRMED' as OrderStatus,        label: 'Confirmed',        dot: 'bg-indigo-500' },
  { status: 'PREPARING' as OrderStatus,        label: 'Preparing',        dot: 'bg-amber-500' },
  { status: 'READY' as OrderStatus,            label: 'Ready',            dot: 'bg-emerald-500' },
  { status: 'OUT_FOR_DELIVERY' as OrderStatus, label: 'Out for Delivery', dot: 'bg-teal-500' },
  { status: 'DELIVERED' as OrderStatus,        label: 'Delivered',        dot: 'bg-green-600' },
  { status: 'CANCELLED' as OrderStatus,        label: 'Cancelled',        dot: 'bg-red-400' },
]

const PAYMENT_FILTERS = [
  { value: '',        label: 'All payments' },
  { value: 'pending', label: 'Unpaid' },
  { value: 'paid',    label: 'Paid' },
]

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; cls: string; next: OrderStatus }>> = {
  NEW:              { label: 'Accept',    next: 'CONFIRMED',  cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  CONFIRMED:        { label: 'Prepare',   next: 'PREPARING',  cls: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  PREPARING:        { label: 'Ready',     next: 'READY',      cls: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  OUT_FOR_DELIVERY: { label: 'Delivered', next: 'DELIVERED',  cls: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' },
}

const limit = 20

// ── State ──────────────────────────────────────────────────────
const loading       = ref(true)
const rows          = ref<OrderRow[]>([])
const kanbanOrders  = ref<Order[]>([])
const meta          = ref<Meta>({ total: 0, page: 1, limit, total_pages: 1 })
const tabCounts     = ref<Record<string, number>>({})
const statusFilter  = ref('')
const paymentFilter = ref('')
const searchQuery   = ref('')
const currentPage   = ref(1)
const advancing     = ref<string | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const tenantId = authStore.user?.tenant_id || ''
const { status: realtimeStatus } = useRealtime(tenantId)

// ── Computed ───────────────────────────────────────────────────
const isListView  = computed(() => settingsStore.orderView === 'list')
const totalPages  = computed(() => meta.value.total_pages)
const hasFilters  = computed(() => !!statusFilter.value || !!paymentFilter.value || !!searchQuery.value)

const kanbanByStatus = computed(() => {
  const map: Record<string, Order[]> = {}
  for (const o of kanbanOrders.value) {
    if (!map[o.status]) map[o.status] = []
    map[o.status].push(o)
  }
  return map
})

const rangeLabel = computed(() => {
  const total = meta.value.total
  if (!total) return '0 results'
  const from = (currentPage.value - 1) * limit + 1
  const to   = Math.min(currentPage.value * limit, total)
  return `${from}–${to} of ${total}`
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  const pages: number[] = []
  const start = Math.max(1, cur - 2)
  const end   = Math.min(total, cur + 2)
  if (start > 1) { pages.push(1); if (start > 2) pages.push(-1) }
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total) { if (end < total - 1) pages.push(-1); pages.push(total) }
  return pages
})

// ── Helpers ────────────────────────────────────────────────────
function statusDot(s: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    NEW: 'bg-blue-500', CONFIRMED: 'bg-indigo-500', PREPARING: 'bg-amber-500',
    READY: 'bg-emerald-500', OUT_FOR_DELIVERY: 'bg-teal-500',
    DELIVERED: 'bg-green-600', CANCELLED: 'bg-red-400',
  }
  return map[s] ?? 'bg-slate-300'
}

function paymentLabel(method: string | null) {
  if (method === 'pay_on_delivery') return 'On delivery'
  if (method === 'mpesa') return 'M-Pesa'
  if (method === 'card') return 'Card'
  return method ?? ''
}

function nextAction(status: OrderStatus) {
  return NEXT_ACTION[status] ?? null
}

// ── Data ───────────────────────────────────────────────────────
async function loadList() {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: String(currentPage.value), limit: String(limit) })
    if (statusFilter.value)  qs.set('status', statusFilter.value)
    if (paymentFilter.value) qs.set('payment_status', paymentFilter.value)
    if (searchQuery.value)   qs.set('search', searchQuery.value)

    const res = await apiFetch<{
      success: boolean
      data: { items: OrderRow[]; total: number; page: number; limit: number } | null
    }>(`/api/orders?${qs}`)

    if (res.success && res.data) {
      rows.value = res.data.items
      meta.value = {
        total: res.data.total,
        page:  res.data.page,
        limit: res.data.limit,
        total_pages: Math.ceil(res.data.total / res.data.limit),
      }
    }
  } catch { /* ignore */ } finally { loading.value = false }
}

async function loadKanban() {
  loading.value = true
  try {
    const res = await apiFetch<{
      success: boolean
      data: { items: Order[]; total: number } | null
    }>('/api/orders?limit=100')
    if (res.success && res.data) kanbanOrders.value = res.data.items
  } catch { /* ignore */ } finally { loading.value = false }
}

async function loadCounts() {
  try {
    const statuses = ['', ...STATUS_TABS.filter(t => t.value).map(t => t.value)]
    const results = await Promise.all(
      statuses.map(s =>
        apiFetch<{ success: boolean; data: { total: number } | null }>(
          `/api/orders?page=1&limit=1${s ? `&status=${s}` : ''}`
        )
      )
    )
    statuses.forEach((s, i) => {
      const r = results[i]
      if (r.success && r.data) tabCounts.value[s] = r.data.total
    })
  } catch { /* ignore */ }
}

function load() {
  if (isListView.value) loadList()
  else loadKanban()
}

// ── Actions ────────────────────────────────────────────────────
function setStatus(v: string)  { statusFilter.value = v;  currentPage.value = 1 }
function setPayment(v: string) { paymentFilter.value = v; currentPage.value = 1 }
function goTo(p: number) { if (p >= 1 && p <= totalPages.value) currentPage.value = p }
function goToDetail(id: string) { router.push(`/orders/${id}`) }

function clearFilters() {
  statusFilter.value = ''
  paymentFilter.value = ''
  searchQuery.value = ''
  currentPage.value = 1
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1 }, 350)
}

function refresh() { load(); loadCounts() }

async function advance(order: OrderRow) {
  const action = nextAction(order.status)
  if (!action) return
  advancing.value = order.id
  try {
    await apiFetch(`/api/orders/${order.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: action.next }),
    })
    order.status = action.next
    if (tabCounts.value[order.status] != null) tabCounts.value[order.status]--
    if (tabCounts.value[action.next]  != null) tabCounts.value[action.next]++
  } catch { /* ignore */ } finally { advancing.value = null }
}

function handleKanbanStatus(orderId: string, status: OrderStatus) {
  const o = kanbanOrders.value.find(x => x.id === orderId)
  if (o) o.status = status
}

// ── Watchers ───────────────────────────────────────────────────
watch(isListView, () => load())
watch([statusFilter, paymentFilter, currentPage], () => { if (isListView.value) loadList() })
watch(searchQuery, () => { if (isListView.value) loadList() })

onMounted(() => { load(); loadCounts() })
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>
