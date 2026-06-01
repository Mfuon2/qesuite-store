<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <section class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-950 sm:text-3xl">Good {{ greeting }}, {{ firstName }}! 👋</h1>
        <p class="mt-1 text-sm text-slate-500">Here's what's happening with your store today.</p>
      </div>
      <!-- Period selector — same visual, now functional -->
      <button @click="cyclePeriod" class="inline-flex items-center gap-2 self-start rounded-xl border border-[#d0daca] bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm lg:self-auto">
        <CalendarDaysIcon class="h-4 w-4 text-slate-500" />
        {{ dateRangeDisplay }}
        <ChevronDownIcon class="h-4 w-4 text-slate-500" />
      </button>
    </section>

    <!-- Stat cards + hero -->
    <section class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <template v-if="kpiLoading">
        <div v-for="i in 4" :key="i" class="qs-stat-card skeleton h-[112px] p-4" />
        <div class="qs-hero-card skeleton h-[112px] p-5 sm:col-span-2 xl:col-span-1" />
      </template>
      <template v-else>
        <div v-for="card in statCards" :key="card.label" class="qs-stat-card p-4">
          <div class="mb-4 flex items-start justify-between">
            <p class="text-sm font-medium text-slate-600">{{ card.label }}</p>
            <div :class="['qs-icon-tile', card.tone]">
              <component :is="card.icon" class="h-5 w-5" />
            </div>
          </div>
          <p class="text-2xl font-extrabold text-slate-950">{{ card.value }}</p>
          <p class="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span :class="['font-bold', card.changeTone]">{{ card.changeDir }} {{ card.change }}</span>
            {{ periodCompareLabel }}
          </p>
        </div>

        <div class="qs-hero-card relative overflow-hidden p-5 sm:col-span-2 xl:col-span-1">
          <div class="relative z-10">
            <p class="text-sm font-medium text-white/90">Today's Sales</p>
            <p class="mt-5 text-3xl font-extrabold">KES {{ todaySales.toLocaleString() }}</p>
            <p class="mt-3 text-sm text-white/90">{{ heroChangeTxt }}</p>
          </div>
          <div class="absolute bottom-3 right-4 text-6xl drop-shadow-sm">🧺</div>
        </div>
      </template>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.9fr)_360px]">
      <!-- Sales Overview chart -->
      <div class="qs-surface p-4">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-950">Sales Overview</h2>
            <p class="mt-3 text-2xl font-extrabold text-slate-950">
              KES {{ totalSales.toLocaleString() }}
              <span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{{ overviewChangeTxt }}</span>
            </p>
          </div>
          <button @click="cyclePeriod" class="rounded-lg border border-[#d0daca] bg-white px-3 py-2 text-sm font-semibold text-slate-700">{{ periodLabel }}</button>
        </div>
        <div class="relative h-56">
          <template v-if="chartLoading">
            <div class="skeleton absolute inset-x-0 top-0 h-48 rounded-xl" />
          </template>
          <template v-else>
            <div class="absolute inset-x-0 top-0 h-px bg-slate-100"></div>
            <div class="absolute inset-x-0 top-1/4 h-px bg-slate-100"></div>
            <div class="absolute inset-x-0 top-1/2 h-px bg-slate-100"></div>
            <div class="absolute inset-x-0 top-3/4 h-px bg-slate-100"></div>
            <svg class="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 700 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#148447" stop-opacity=".22" />
                  <stop offset="100%" stop-color="#148447" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path :d="areaPath" fill="url(#salesFill)" />
              <path :d="linePath" fill="none" stroke="#148447" stroke-width="3" vector-effect="non-scaling-stroke" />
              <circle v-for="point in chartPoints" :key="point.x" :cx="point.x" :cy="point.y" r="4" fill="white" stroke="#148447" stroke-width="3" />
            </svg>
          </template>
          <div class="absolute inset-x-0 bottom-0 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
            <span v-for="day in days" :key="day">{{ day }}</span>
          </div>
        </div>
      </div>

      <!-- Order Status -->
      <div class="qs-surface p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-950">Order Status</h2>
          <RouterLink to="/orders" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <template v-if="statusLoading">
            <div v-for="i in 6" :key="i" class="skeleton my-2 h-9 rounded-xl" />
          </template>
          <template v-else>
            <div v-for="status in orderStatuses" :key="status.label" class="flex items-center gap-3 py-3">
              <div :class="['grid h-8 w-8 place-items-center rounded-full text-white', status.bg]">
                <component :is="status.icon" class="h-4 w-4" />
              </div>
              <span class="flex-1 text-sm font-semibold text-slate-800">{{ status.label }}</span>
              <span class="text-sm font-medium text-slate-950">{{ status.count }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Quick tiles + Recent Activity (unchanged) -->
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <RouterLink v-for="tile in quickTiles" :key="tile.label" :to="tile.to" class="qs-surface flex min-h-24 flex-col items-center justify-center gap-2 p-3 text-center">
            <div :class="['qs-icon-tile', tile.tone]">
              <component :is="tile.icon" class="h-5 w-5" />
            </div>
            <span class="text-xs font-bold text-slate-800">{{ tile.label }}</span>
          </RouterLink>
        </div>
        <div class="qs-surface p-4">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-950">Recent Activity</h2>
            <RouterLink to="/orders" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
          </div>
          <div class="divide-y divide-slate-100">
            <template v-if="ordersLoading">
              <div v-for="i in 4" :key="i" class="skeleton my-2 h-9 rounded-xl" />
            </template>
            <template v-else>
              <div v-for="item in recentActivity" :key="item.text" class="flex items-center gap-3 py-3">
                <div :class="['grid h-8 w-8 place-items-center rounded-full', item.bg]">
                  <component :is="item.icon" class="h-4 w-4" />
                </div>
                <p class="flex-1 text-sm font-medium text-slate-700">{{ item.text }}</p>
                <span class="text-xs text-slate-500">{{ item.time }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]">
      <!-- Recent Orders -->
      <div class="qs-surface overflow-hidden p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-950">Recent Orders</h2>
          <RouterLink to="/orders" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th class="py-3">Order</th>
                <th class="py-3">Customer</th>
                <th class="py-3">Items</th>
                <th class="py-3">Total</th>
                <th class="py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template v-if="ordersLoading">
                <tr v-for="i in 5" :key="i">
                  <td colspan="5" class="py-2"><div class="skeleton h-8 rounded-lg" /></td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td class="py-3 font-bold text-emerald-700">#{{ order.tracking_code }}</td>
                  <td class="py-3 text-slate-700">{{ order.customer_name || order.customer_phone }}</td>
                  <td class="py-3 text-slate-700">{{ itemsCount(order.items_summary) }}</td>
                  <td class="py-3 font-semibold text-slate-900">KES {{ order.total.toLocaleString() }}</td>
                  <td class="py-3"><span :class="['rounded-full px-2.5 py-1 text-xs font-bold', statusPill(order.status)]">{{ statusLabel(order.status) }}</span></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Products -->
      <div class="qs-surface p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-950">Top Products</h2>
          <RouterLink to="/products" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <template v-if="productsLoading">
            <div v-for="i in 5" :key="i" class="skeleton my-2 h-10 rounded-xl" />
          </template>
          <template v-else>
            <div v-for="product in topProducts" :key="product.name" class="flex items-center gap-3 py-3">
              <div class="grid h-10 w-10 place-items-center rounded-xl border border-slate-100 bg-white text-2xl">{{ product.emoji }}</div>
              <span class="flex-1 text-sm font-semibold text-slate-800">{{ product.name }}</span>
              <span class="text-xs text-slate-500">{{ product.sold }} sold</span>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  BanknotesIcon, ShoppingBagIcon, ChartBarIcon, UserPlusIcon,
  CalendarDaysIcon, ChevronDownIcon, ClipboardDocumentListIcon,
  CheckCircleIcon, TruckIcon, XCircleIcon, CubeIcon, UsersIcon,
  BuildingStorefrontIcon, ArchiveBoxIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { getGreeting } from '@/composables/useDateFormat'
import { apiFetch } from '@/api/index'
import type { OrderStatus } from '@qesuite/types'

const auth = useAuthStore()
const firstName = computed(() => (auth.user?.name || 'Store').split(' ')[0])
const greeting = computed(() => getGreeting())

// ─── Period ───────────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month'
const period = ref<Period>('today')

const periodOrder: Period[] = ['today', 'week', 'month']
function cyclePeriod() {
  const idx = periodOrder.indexOf(period.value)
  period.value = periodOrder[(idx + 1) % periodOrder.length]
}

const periodLabel = computed(() =>
  period.value === 'today' ? 'Today' : period.value === 'week' ? 'This Week' : 'This Month'
)
const periodCompareLabel = computed(() =>
  period.value === 'today' ? 'vs yesterday' : period.value === 'week' ? 'vs last 7 days' : 'vs last 30 days'
)
const dateRangeDisplay = computed(() => {
  const fmt = (d: Date) => d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  const to = new Date()
  if (period.value === 'today') return fmt(to)
  const from = new Date()
  from.setDate(from.getDate() - (period.value === 'week' ? 6 : 29))
  return `${fmt(from)} - ${fmt(to)}`
})
function buildQs() { return `?period=${period.value}` }

// ─── A. KPI Summary ──────────────────────────────────────────────────────────
interface SummaryData {
  total_revenue: number; total_orders: number; avg_order_value: number
  cancelled_orders: number; completion_rate: number; period_days: number
  prev: { total_revenue: number; total_orders: number; avg_order_value: number }
}

const kpiLoading = ref(true)
const kpiData = ref<SummaryData | null>(null)

// Always today — for the hero card
const todayData = ref<SummaryData | null>(null)

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

const totalSales = computed(() => kpiData.value?.total_revenue ?? 0)
const todaySales = computed(() => todayData.value?.total_revenue ?? 0)

const heroChangePct = computed(() => {
  if (!todayData.value) return 0
  return pctChange(todayData.value.total_revenue, todayData.value.prev.total_revenue)
})
const heroChangeTxt = computed(() => {
  const p = heroChangePct.value
  return `${p >= 0 ? '↑' : '↓'} ${Math.abs(p)}% vs yesterday`
})

const overviewChangePct = computed(() => {
  if (!kpiData.value) return 0
  return pctChange(kpiData.value.total_revenue, kpiData.value.prev.total_revenue)
})
const overviewChangeTxt = computed(() => {
  const p = overviewChangePct.value
  return `${p >= 0 ? '↑' : '↓'} ${Math.abs(p)}%`
})

const statCards = computed(() => {
  const d = kpiData.value
  const s = statusData.value
  const revPct = d ? pctChange(d.total_revenue, d.prev.total_revenue) : 0
  const ordPct = d ? pctChange(d.total_orders, d.prev.total_orders) : 0
  const aovPct = d ? pctChange(d.avg_order_value, d.prev.avg_order_value) : 0
  const newCust = s?.new_customers ?? 0
  const card = (pct: number, changeTone?: string) => ({
    changeDir: pct >= 0 ? '↑' : '↓',
    change: `${Math.abs(pct)}%`,
    changeTone: changeTone ?? (pct >= 0 ? 'text-emerald-700' : 'text-red-500'),
  })
  return [
    { label: 'Total Sales', value: `KES ${(d?.total_revenue ?? 0).toLocaleString()}`, icon: BanknotesIcon, tone: 'bg-emerald-100 text-emerald-700', ...card(revPct) },
    { label: 'Orders', value: d?.total_orders ?? 0, icon: ShoppingBagIcon, tone: 'bg-amber-100 text-amber-700', ...card(ordPct) },
    { label: 'Average Order Value', value: `KES ${(d?.avg_order_value ?? 0).toLocaleString()}`, icon: ChartBarIcon, tone: 'bg-blue-100 text-blue-700', ...card(aovPct) },
    { label: 'New Customers', value: newCust, icon: UserPlusIcon, tone: 'bg-violet-100 text-violet-700', changeDir: '', change: `${s?.unique_customers ?? 0} unique`, changeTone: 'text-slate-400' },
  ]
})

async function fetchKpis() {
  kpiLoading.value = true
  try {
    const res = await apiFetch<{ success: boolean; data: SummaryData }>(`/api/analytics/summary${buildQs()}`)
    if (res.success && res.data) kpiData.value = res.data
  } catch { /* ignore */ } finally { kpiLoading.value = false }
}

async function fetchTodayKpi() {
  try {
    const res = await apiFetch<{ success: boolean; data: SummaryData }>('/api/analytics/summary?period=today')
    if (res.success && res.data) todayData.value = res.data
  } catch { /* ignore */ }
}

// ─── B. Revenue Chart ────────────────────────────────────────────────────────
interface RevenuePoint { date: string; revenue: number; order_count: number }

const chartLoading = ref(true)
const chartSeries = ref<RevenuePoint[]>([])

// Sample series to exactly 7 evenly-spaced points for the fixed 7-column grid
const sampledSeries = computed(() => {
  const data = chartSeries.value
  if (!data.length) return []
  if (data.length <= 7) {
    // Pad to 7 with zero entries at the start
    const pad = 7 - data.length
    const zeros: RevenuePoint[] = Array.from({ length: pad }, (_, i) => ({ date: `pad-${i}`, revenue: 0, order_count: 0 }))
    return [...zeros, ...data]
  }
  const step = (data.length - 1) / 6
  return Array.from({ length: 7 }, (_, i) => data[Math.round(i * step)])
})

const chartPoints = computed(() => {
  const data = sampledSeries.value
  if (!data.length) return [
    { x: 20, y: 165 }, { x: 130, y: 130 }, { x: 240, y: 125 },
    { x: 350, y: 88 }, { x: 460, y: 105 }, { x: 570, y: 54 }, { x: 680, y: 86 },
  ]
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  return data.map((d, i) => ({
    x: 20 + i * (660 / 6),
    y: 20 + (1 - d.revenue / maxRev) * 185,
  }))
})

const linePath = computed(() => chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '))
const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return `${linePath.value} L ${pts[pts.length - 1].x} 210 L ${pts[0].x} 210 Z`
})

const days = computed(() => {
  const data = sampledSeries.value
  if (!data.length) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return data.map(d => {
    if (d.date.startsWith('pad-')) return ''
    const dt = new Date(d.date)
    if (period.value === 'today') return 'Today'
    if (period.value === 'week') return dt.toLocaleDateString('en', { weekday: 'short' })
    return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  })
})

async function fetchChart() {
  chartLoading.value = true
  try {
    const res = await apiFetch<{ success: boolean; data: RevenuePoint[] }>(`/api/analytics/revenue${buildQs()}`)
    if (res.success && res.data) chartSeries.value = res.data
  } catch { /* ignore */ } finally { chartLoading.value = false }
}

// ─── C. Order Status ─────────────────────────────────────────────────────────
interface StatusPayload { counts: Record<string, number>; unique_customers: number; new_customers: number }

const statusLoading = ref(true)
const statusData = ref<StatusPayload | null>(null)

const orderStatuses = computed(() => {
  const c = statusData.value?.counts ?? {}
  return [
    { label: 'New', key: 'NEW', bg: 'bg-slate-400', icon: ClipboardDocumentListIcon },
    { label: 'Confirmed', key: 'CONFIRMED', bg: 'bg-blue-500', icon: ShoppingBagIcon },
    { label: 'Preparing', key: 'PREPARING', bg: 'bg-amber-500', icon: ArchiveBoxIcon },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY', bg: 'bg-violet-500', icon: TruckIcon },
    { label: 'Delivered', key: 'DELIVERED', bg: 'bg-emerald-600', icon: CheckCircleIcon },
    { label: 'Cancelled', key: 'CANCELLED', bg: 'bg-red-500', icon: XCircleIcon },
  ].map(row => ({ ...row, count: c[row.key] ?? 0 }))
})

async function fetchStatus() {
  statusLoading.value = true
  try {
    const res = await apiFetch<{ success: boolean; data: StatusPayload }>(`/api/analytics/order-status${buildQs()}`)
    if (res.success && res.data) statusData.value = res.data
  } catch { /* ignore */ } finally { statusLoading.value = false }
}

// ─── D. Recent Orders ────────────────────────────────────────────────────────
interface DashOrder {
  id: string; tracking_code: string; status: OrderStatus
  customer_name: string | null; customer_phone: string
  total: number; created_at: string; items_summary: string | null
}

const ordersLoading = ref(true)
const ordersData = ref<DashOrder[]>([])

const recentOrders = computed(() => ordersData.value)

const recentActivity = computed(() => {
  const source = ordersData.value
  if (!source.length) return []
  const activityIcon: Record<OrderStatus, { bg: string; icon: typeof ShoppingBagIcon }> = {
    NEW: { bg: 'bg-emerald-100 text-emerald-700', icon: ShoppingBagIcon },
    CONFIRMED: { bg: 'bg-blue-100 text-blue-700', icon: ClipboardDocumentListIcon },
    PREPARING: { bg: 'bg-amber-100 text-amber-700', icon: ArchiveBoxIcon },
    READY: { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon },
    OUT_FOR_DELIVERY: { bg: 'bg-violet-100 text-violet-700', icon: TruckIcon },
    DELIVERED: { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon },
    CANCELLED: { bg: 'bg-red-100 text-red-700', icon: XCircleIcon },
  }
  return source.slice(0, 4).map(order => {
    const meta = activityIcon[order.status] ?? activityIcon.NEW
    return {
      text: `Order #${order.tracking_code} ${statusLabel(order.status).toLowerCase()}`,
      time: timeAgo(order.created_at),
      bg: meta.bg,
      icon: meta.icon,
    }
  })
})

async function fetchRecentOrders() {
  ordersLoading.value = true
  try {
    const res = await apiFetch<{ success: boolean; data: { items: DashOrder[] } }>(`/api/orders?limit=8&period=${period.value}`)
    if (res.success && res.data) ordersData.value = res.data.items ?? []
  } catch { /* ignore */ } finally { ordersLoading.value = false }
}

// ─── E. Top Products ──────────────────────────────────────────────────────────
interface RawTopProduct { product_name: string; total_quantity: number; total_revenue: number }

const productsLoading = ref(true)
const productsData = ref<RawTopProduct[]>([])

const EMOJI_MAP: [RegExp, string][] = [
  [/tomato/i, '🍅'], [/banana/i, '🍌'], [/milk/i, '🥛'], [/bread/i, '🥖'],
  [/oil/i, '🫙'], [/rice/i, '🍚'], [/sugar/i, '🍬'], [/flour/i, '🌾'],
  [/egg/i, '🥚'], [/chicken/i, '🍗'], [/beef/i, '🥩'], [/fish/i, '🐟'],
  [/onion/i, '🧅'], [/potato/i, '🥔'], [/carrot/i, '🥕'], [/water/i, '💧'],
  [/juice/i, '🧃'], [/tea/i, '🍵'], [/coffee/i, '☕'], [/soap/i, '🧼'],
]
function productEmoji(name: string) {
  return EMOJI_MAP.find(([re]) => re.test(name))?.[1] ?? '📦'
}

const topProducts = computed(() =>
  productsData.value.map(p => ({
    emoji: productEmoji(p.product_name),
    name: p.product_name,
    sold: p.total_quantity,
  }))
)

async function fetchTopProducts() {
  productsLoading.value = true
  try {
    const res = await apiFetch<{ success: boolean; data: { by_volume: RawTopProduct[] } }>(`/api/analytics/top-products${buildQs()}`)
    if (res.success && res.data) productsData.value = res.data.by_volume ?? []
  } catch { /* ignore */ } finally { productsLoading.value = false }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusLabel(status: OrderStatus) {
  return status.split('_').join(' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
}

function statusPill(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    NEW: 'bg-emerald-50 text-emerald-700',
    CONFIRMED: 'bg-blue-50 text-blue-700',
    PREPARING: 'bg-amber-50 text-amber-700',
    READY: 'bg-emerald-50 text-emerald-700',
    OUT_FOR_DELIVERY: 'bg-violet-50 text-violet-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
  }
  return map[status] ?? 'bg-slate-50 text-slate-700'
}

function itemsCount(summary: string | null) {
  if (!summary) return '—'
  const n = summary.split(',').length
  return `${n} item${n !== 1 ? 's' : ''}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Static quick tiles
const quickTiles = [
  { label: 'Orders', to: '/orders', icon: ShoppingBagIcon, tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Products', to: '/products', icon: CubeIcon, tone: 'bg-amber-100 text-amber-700' },
  { label: 'Delivery', to: '/delivery', icon: TruckIcon, tone: 'bg-green-100 text-green-700' },
  { label: 'Customers', to: '/orders', icon: UsersIcon, tone: 'bg-violet-100 text-violet-700' },
  { label: 'Analytics', to: '/analytics', icon: ChartBarIcon, tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Storefront', to: '/settings', icon: BuildingStorefrontIcon, tone: 'bg-blue-100 text-blue-700' },
]

// ─── Load & Reload ────────────────────────────────────────────────────────────
function loadAll() {
  fetchKpis()
  fetchChart()
  fetchStatus()
  fetchRecentOrders()
  fetchTopProducts()
}

onMounted(() => {
  fetchTodayKpi()   // hero card always uses today
  loadAll()
})

watch(period, loadAll)
</script>
