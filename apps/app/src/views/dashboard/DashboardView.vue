<template>
  <div class="owner-page">
    <section class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-slate-950 sm:text-2xl">Good {{ greeting }}, {{ firstName }}!</h1>
        <p class="mt-0.5 text-xs text-slate-500">Here's what's happening with your store today.</p>
      </div>
      <!-- Period selector — same visual, now functional -->
      <button @click="cyclePeriod" class="inline-flex min-h-9 items-center gap-1.5 self-start rounded-xl border border-[#d0daca] bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm lg:self-auto">
        <CalendarDaysIcon class="h-4 w-4 text-slate-500" />
        {{ dateRangeDisplay }}
        <ChevronDownIcon class="h-4 w-4 text-slate-500" />
      </button>
    </section>

    <!-- Stat cards + hero -->
    <section class="mb-3">
      <div
        ref="kpiScroller"
        class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-7"
        role="region"
        aria-label="Store statistics"
        @scroll.passive="updateActiveKpi"
      >
        <template v-if="kpiLoading">
          <div
            v-for="i in 6"
            :key="i"
            class="qs-stat-card skeleton h-24 w-[82vw] max-w-[19rem] shrink-0 snap-center p-2.5 sm:w-auto sm:max-w-none"
          />
          <div class="qs-hero-card skeleton h-24 w-[82vw] max-w-[19rem] shrink-0 snap-center p-2.5 sm:col-span-2 sm:w-auto sm:max-w-none xl:col-span-1" />
        </template>
        <template v-else>
          <div
            v-for="card in statCards"
            :key="card.label"
            class="qs-stat-card h-24 w-[82vw] max-w-[19rem] shrink-0 snap-center p-2.5 sm:w-auto sm:max-w-none"
          >
            <div class="mb-1.5 flex items-start justify-between">
              <p class="text-xs font-semibold text-slate-600">{{ card.label }}</p>
              <div :class="['qs-icon-tile', card.tone]">
                <component :is="card.icon" class="h-4 w-4" />
              </div>
            </div>
            <p class="truncate text-lg font-extrabold leading-none text-slate-950">{{ card.value }}</p>
            <p class="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span :class="['font-bold', card.changeTone]">{{ card.changeDir }} {{ card.change }}</span>
              {{ periodCompareLabel }}
            </p>
          </div>

          <div class="qs-hero-card relative h-24 w-[82vw] max-w-[19rem] shrink-0 snap-center overflow-hidden p-2.5 sm:col-span-2 sm:w-auto sm:max-w-none xl:col-span-1">
            <div class="relative z-10">
              <p class="text-xs font-semibold text-white/90">Today's Sales</p>
              <p class="mt-2 text-2xl font-extrabold leading-none">KES {{ todaySales.toLocaleString() }}</p>
              <p class="mt-1.5 text-xs text-white/90">{{ heroChangeTxt }}</p>
            </div>
            <ShoppingBagIcon class="absolute bottom-2 right-3 h-12 w-12 text-white/25 drop-shadow-sm sm:bottom-3 sm:right-4 sm:h-14 sm:w-14 sm:text-white/30" />
          </div>
        </template>
      </div>

      <div class="mt-2 flex items-center justify-center gap-1.5 sm:hidden" aria-label="Statistics carousel pages">
        <button
          v-for="i in statCards.length + 1"
          :key="i"
          type="button"
          :class="[
            'h-1.5 rounded-full transition-all duration-200',
            activeKpi === i - 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'
          ]"
          :aria-label="`Show statistic ${i} of ${statCards.length + 1}`"
          :aria-current="activeKpi === i - 1 ? 'true' : undefined"
          @click="scrollToKpi(i - 1)"
        />
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.9fr)_330px]">
      <!-- Sales and expense performance chart -->
      <div class="qs-surface p-3">
        <div class="mb-2 flex items-start justify-between gap-2">
          <div>
            <h2 class="text-sm font-bold text-slate-950">Sales, expenses &amp; variance</h2>
            <p class="mt-1 text-xs font-semibold text-slate-600">
              Sales KES {{ totalSales.toLocaleString() }}
              <span class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{{ overviewChangeTxt }}</span>
            </p>
          </div>
          <button @click="cyclePeriod" class="rounded-lg border border-[#d0daca] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">{{ periodLabel }}</button>
        </div>
        <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500">
          <span class="flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-emerald-500" /> Sales</span>
          <span class="flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-orange-500" /> Expenses KES {{ totalExpenses.toLocaleString() }}</span>
          <span class="flex items-center gap-1" :class="periodVariance < 0 ? 'text-red-600' : 'text-blue-600'"><i class="h-2 w-2 rounded-full bg-blue-600" /> Variance {{ formatSignedKes(periodVariance) }}</span>
        </div>
        <div class="relative h-44">
          <template v-if="chartLoading">
            <div class="skeleton absolute inset-x-0 top-0 h-48 rounded-xl" />
          </template>
          <template v-else-if="sampledSeries.length">
            <div class="absolute inset-x-0 top-0 h-px bg-slate-100"></div>
            <div class="absolute inset-x-0 top-1/4 h-px bg-slate-100"></div>
            <div class="absolute inset-x-0 top-1/2 h-px bg-slate-100"></div>
            <div class="absolute inset-x-0 top-3/4 h-px bg-slate-100"></div>
            <svg class="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 700 220" preserveAspectRatio="none">
              <line x1="20" x2="680" :y1="chartZeroY" :y2="chartZeroY" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4" />
              <path :d="salesLinePath" fill="none" stroke="#10b981" stroke-width="3" vector-effect="non-scaling-stroke" />
              <path :d="expenseLinePath" fill="none" stroke="#f97316" stroke-width="3" vector-effect="non-scaling-stroke" />
              <path :d="varianceLinePath" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6 5" vector-effect="non-scaling-stroke" />
            </svg>
          </template>
          <p v-else class="absolute inset-0 grid place-items-center text-xs text-slate-400">No sales or expenses in this period</p>
          <div class="absolute inset-x-0 bottom-0 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
            <span v-for="(day, i) in days" :key="i">{{ day }}</span>
          </div>
        </div>
        <p class="mt-1 text-[10px] leading-4 text-slate-400">Estimated variance uses only the expenses recorded in the app.</p>
      </div>

      <!-- Order Status -->
      <div class="qs-surface p-3">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-950">Order Status</h2>
          <RouterLink to="/orders" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <template v-if="statusLoading">
            <div v-for="i in 6" :key="i" class="skeleton my-2 h-9 rounded-xl" />
          </template>
          <template v-else>
            <div v-for="status in orderStatuses" :key="status.label" class="flex items-center gap-2 py-2">
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
        <div>
          <div
            ref="quickScroller"
            class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0"
            role="region"
            aria-label="Quick actions"
            @scroll.passive="updateQuickPage"
          >
            <RouterLink
              v-for="tile in quickTiles"
              :key="tile.label"
              :to="tile.to"
              class="qs-surface flex h-20 w-[5.5rem] shrink-0 snap-start flex-col items-center justify-center gap-1.5 p-2 text-center transition active:scale-[0.97] sm:min-h-24 sm:h-auto sm:w-auto sm:gap-2 sm:p-3"
            >
              <div :class="['qs-icon-tile !h-9 !w-9 !rounded-xl sm:!h-[2.55rem] sm:!w-[2.55rem]', tile.tone]">
                <component :is="tile.icon" class="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </div>
              <span class="text-[11px] font-bold leading-none text-slate-800 sm:text-xs sm:leading-normal">{{ tile.label }}</span>
            </RouterLink>
          </div>

          <div class="mt-2 flex items-center justify-center gap-1.5 sm:hidden" aria-label="Quick action carousel pages">
            <button
              v-for="i in quickPageCount"
              :key="i"
              type="button"
              :class="[
                'h-1.5 rounded-full transition-all duration-200',
                activeQuickPage === i - 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'
              ]"
              :aria-label="`Show quick actions page ${i} of ${quickPageCount}`"
              :aria-current="activeQuickPage === i - 1 ? 'true' : undefined"
              @click="scrollToQuickPage(i - 1)"
            />
          </div>
        </div>
        <div class="qs-surface p-3">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-950">Recent Activity</h2>
            <RouterLink to="/orders" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
          </div>
          <div class="divide-y divide-slate-100">
            <template v-if="ordersLoading">
              <div v-for="i in 4" :key="i" class="skeleton my-2 h-9 rounded-xl" />
            </template>
            <template v-else>
              <div v-for="item in recentActivity" :key="item.text" class="flex items-center gap-2 py-2">
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

    <section class="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
      <!-- Recent Orders -->
      <div class="qs-surface overflow-hidden p-3">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-950">Recent Orders</h2>
          <RouterLink to="/orders" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th class="py-2">Order</th>
                <th class="py-2">Customer</th>
                <th class="py-2">Items</th>
                <th class="py-2">Total</th>
                <th class="py-2">Status</th>
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
                  <td class="py-2 font-bold text-emerald-700">#{{ order.tracking_code }}</td>
                  <td class="py-2 text-slate-700">{{ order.customer_name || order.customer_phone }}</td>
                  <td class="py-2 text-slate-700">{{ itemsCount(order.items_summary) }}</td>
                  <td class="py-2 font-semibold text-slate-900">KES {{ order.total.toLocaleString() }}</td>
                  <td class="py-2"><span :class="['rounded-full px-2.5 py-1 text-xs font-bold', statusPill(order.status)]">{{ statusLabel(order.status) }}</span></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Products -->
      <div class="qs-surface p-3">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-950">Top Products</h2>
          <RouterLink to="/products" class="text-sm font-semibold text-emerald-700">View all</RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <template v-if="productsLoading">
            <div v-for="i in 5" :key="i" class="skeleton my-2 h-10 rounded-xl" />
          </template>
          <template v-else>
            <div v-for="product in topProducts" :key="product.name" class="flex items-center gap-2 py-2">
              <div class="grid h-10 w-10 place-items-center rounded-xl border border-slate-100 bg-white"><CubeIcon class="h-5 w-5 text-emerald-600" /></div>
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
  BuildingStorefrontIcon, ArchiveBoxIcon, ReceiptRefundIcon, ScaleIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { getGreeting } from '@/composables/useDateFormat'
import { useSnapCarousel } from '@/composables/useSnapCarousel'
import { apiFetch } from '@/api/index'
import type { OrderStatus } from '@qesuite/types'
import { APP_TIME_ZONE, addDays, parseAppTimestamp, todayNairobi } from '@qesuite/shared'

const auth = useAuthStore()
const firstName = computed(() => (auth.user?.name || 'Store').split(' ')[0])
const greeting = computed(() => getGreeting())

// ─── Mobile KPI carousel ─────────────────────────────────────────────────────
const {
  scroller: kpiScroller,
  activeIndex: activeKpi,
  updateActiveIndex: updateActiveKpi,
  scrollToIndex: scrollToKpi,
} = useSnapCarousel()
const quickScroller = ref<HTMLElement | null>(null)
const activeQuickPage = ref(0)
const quickPageSize = 3
const quickPageCount = computed(() => Math.ceil(quickTiles.length / quickPageSize))

function updateQuickPage() {
  const scroller = quickScroller.value
  if (!scroller) return

  const maxScroll = scroller.scrollWidth - scroller.clientWidth
  activeQuickPage.value = maxScroll > 0
    ? Math.min(quickPageCount.value - 1, Math.round((scroller.scrollLeft / maxScroll) * (quickPageCount.value - 1)))
    : 0
}

function scrollToQuickPage(page: number) {
  const scroller = quickScroller.value
  if (!scroller) return

  const maxScroll = scroller.scrollWidth - scroller.clientWidth
  scroller.scrollTo({
    left: quickPageCount.value > 1 ? (maxScroll * page) / (quickPageCount.value - 1) : 0,
    behavior: 'smooth',
  })
}

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
  const fmt = (value: string) => parseAppTimestamp(value).toLocaleDateString('en-KE', {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const to = todayNairobi()
  if (period.value === 'today') return fmt(to)
  const from = addDays(to, -(period.value === 'week' ? 6 : 29))
  return `${fmt(from)} - ${fmt(to)}`
})
function buildQs() { return `?period=${period.value}` }

// ─── A. KPI Summary ──────────────────────────────────────────────────────────
interface SummaryData {
  total_revenue: number; total_orders: number; avg_order_value: number
  cancelled_orders: number; completion_rate: number; period_days: number
  prev: { total_revenue: number; total_orders: number; avg_order_value: number }
}

interface FinancialPoint {
  date: string
  revenue: number
  expenses: number
  variance: number
}

interface DashboardFinancialData {
  revenue: number
  expenses: number
  variance: number
  online_orders: number
  pos_sales: number
  previous: { revenue: number; expenses: number; variance: number }
  daily: FinancialPoint[]
}

const kpiLoading = ref(true)
const kpiData = ref<SummaryData | null>(null)

// Always today — for the hero card
const todayData = ref<SummaryData | null>(null)
const financialData = ref<DashboardFinancialData | null>(null)

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

const totalSales = computed(() => kpiData.value?.total_revenue ?? 0)
const todaySales = computed(() => todayData.value?.total_revenue ?? 0)
const totalExpenses = computed(() => financialData.value?.expenses ?? 0)
const periodVariance = computed(() => financialData.value?.variance ?? 0)

function formatSignedKes(value: number) {
  return value < 0 ? `-KES ${Math.abs(value).toLocaleString()}` : `KES ${value.toLocaleString()}`
}

function varianceChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : current > 0 ? 100 : -100
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

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
  const finance = financialData.value
  const expensePct = finance ? pctChange(finance.expenses, finance.previous.expenses) : 0
  const resultPct = finance ? varianceChange(finance.variance, finance.previous.variance) : 0
  const newCust = s?.new_customers ?? 0
  const card = (pct: number, changeTone?: string) => ({
    changeDir: pct >= 0 ? '↑' : '↓',
    change: `${Math.abs(pct)}%`,
    changeTone: changeTone ?? (pct >= 0 ? 'text-emerald-700' : 'text-red-500'),
  })
  return [
    { label: 'Total Sales', value: `KES ${(d?.total_revenue ?? 0).toLocaleString()}`, icon: BanknotesIcon, tone: 'bg-emerald-100 text-emerald-700', ...card(revPct) },
    { label: 'Recorded Expenses', value: `KES ${(finance?.expenses ?? 0).toLocaleString()}`, icon: ReceiptRefundIcon, tone: 'bg-orange-100 text-orange-700', ...card(expensePct, expensePct <= 0 ? 'text-emerald-700' : 'text-red-500') },
    { label: 'Estimated Result', value: formatSignedKes(finance?.variance ?? 0), icon: ScaleIcon, tone: finance && finance.variance < 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700', ...card(resultPct) },
    { label: 'Sales', value: d?.total_orders ?? 0, icon: ShoppingBagIcon, tone: 'bg-amber-100 text-amber-700', ...card(ordPct) },
    { label: 'Average Sale', value: `KES ${(d?.avg_order_value ?? 0).toLocaleString()}`, icon: ChartBarIcon, tone: 'bg-blue-100 text-blue-700', ...card(aovPct) },
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

// ─── B. Sales, expenses, and variance chart ─────────────────────────────────
const chartLoading = ref(true)
const chartSeries = computed(() => financialData.value?.daily ?? [])

// Sample series to exactly 7 evenly-spaced points for the fixed 7-column grid
const sampledSeries = computed(() => {
  const data = chartSeries.value
  if (!data.length) return []
  if (data.length <= 7) {
    // Pad to 7 with zero entries at the start
    const pad = 7 - data.length
    const zeros: FinancialPoint[] = Array.from({ length: pad }, (_, i) => ({ date: `pad-${i}`, revenue: 0, expenses: 0, variance: 0 }))
    return [...zeros, ...data]
  }
  const step = (data.length - 1) / 6
  return Array.from({ length: 7 }, (_, i) => data[Math.round(i * step)])
})

const chartBounds = computed(() => {
  const data = sampledSeries.value
  const values = data.flatMap(point => [point.revenue, point.expenses, point.variance])
  const min = Math.min(0, ...values)
  const max = Math.max(1, ...values)
  return { min, max, span: Math.max(1, max - min) }
})

function chartY(value: number) {
  const bounds = chartBounds.value
  return 15 + ((bounds.max - value) / bounds.span) * 175
}

function pointsFor(key: 'revenue' | 'expenses' | 'variance') {
  return sampledSeries.value.map((point, i) => ({
    x: 20 + i * (660 / 6),
    y: chartY(point[key]),
  }))
}

function linePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

const salesLinePath = computed(() => linePath(pointsFor('revenue')))
const expenseLinePath = computed(() => linePath(pointsFor('expenses')))
const varianceLinePath = computed(() => linePath(pointsFor('variance')))
const chartZeroY = computed(() => chartY(0))

const days = computed(() => {
  const data = sampledSeries.value
  if (!data.length) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return data.map(d => {
    if (d.date.startsWith('pad-')) return ''
    const dt = new Date(d.date)
    if (period.value === 'today') return 'Today'
    if (period.value === 'week') return dt.toLocaleDateString('en', { timeZone: APP_TIME_ZONE, weekday: 'short' })
    return dt.toLocaleDateString('en', { timeZone: APP_TIME_ZONE, month: 'short', day: 'numeric' })
  })
})

async function fetchChart() {
  chartLoading.value = true
  try {
    const res = await apiFetch<{ success: boolean; data: DashboardFinancialData }>(`/api/analytics/profit-loss${buildQs()}`)
    if (res.success && res.data) financialData.value = res.data
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

const topProducts = computed(() =>
  productsData.value.map(p => ({
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
  const diff = Date.now() - parseAppTimestamp(iso).getTime()
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
