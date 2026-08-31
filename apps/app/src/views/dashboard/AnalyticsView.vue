<template>
  <div class="owner-page">
    <!-- Header + date range -->
    <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-base font-bold text-gray-900">Analytics</h2>
      <div class="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center">
        <div class="scrollbar-hide -mx-1 flex max-w-full shrink-0 overflow-x-auto rounded-xl border border-gray-200 p-0.5 text-sm sm:mx-0">
          <button
            v-for="r in ranges"
            :key="r.value"
            @click="setRange(r.value)"
            :class="['shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm', analyticsStore.dateRange === r.value ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50']"
          >
            {{ r.label }}
          </button>
        </div>
        <!-- Custom date range -->
        <div v-if="analyticsStore.dateRange === 'custom'" class="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1.5 sm:flex">
          <QeDatePicker v-model="customFrom" size="sm" class="!w-full sm:!w-40" />
          <QeDatePicker v-model="customTo" size="sm" class="!w-full sm:!w-40" />
          <button @click="applyCustom" class="shrink-0 rounded-xl bg-primary px-2.5 py-1.5 text-xs text-white hover:opacity-90 sm:px-3 sm:py-2 sm:text-sm">Apply</button>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <section class="mb-4">
      <div
        ref="metricScroller"
        class="scrollbar-hide -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-9"
        role="region"
        aria-label="Analytics metrics"
        @scroll.passive="updateActiveMetric"
      >
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Revenue"
        :value="summary ? `KES ${summary.total_revenue.toLocaleString()}` : '-'"
        :change="changePercent('total_revenue')"
        :icon="BanknotesIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Cost of goods sold"
        :value="financial ? `KES ${financial.cogs.toLocaleString()}` : '-'"
        :change="financialChange('cogs')"
        :icon="CubeIcon"
        :loading="analyticsStore.loading"
        lower-is-better
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Gross profit"
        :value="financial ? formatSignedKes(financial.gross_profit) : '-'"
        :change="financialChange('gross_profit')"
        :icon="ChartBarIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Recorded expenses"
        :value="financial ? `KES ${financial.expenses.toLocaleString()}` : '-'"
        :change="financialChange('expenses')"
        :icon="ReceiptRefundIcon"
        :loading="analyticsStore.loading"
        lower-is-better
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Net profit"
        :value="financial ? formatSignedKes(financial.net_profit) : '-'"
        :change="financialChange('net_profit')"
        :icon="ScaleIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Sales"
        :value="summary?.total_orders ?? '-'"
        :change="changePercent('total_orders')"
        :icon="ShoppingCartIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Avg. Sale"
        :value="summary ? `KES ${summary.avg_order_value.toLocaleString()}` : '-'"
        :change="changePercent('avg_order_value')"
        :icon="CurrencyDollarIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Completion Rate"
        :value="summary ? `${summary.completion_rate.toFixed(1)}%` : '-'"
        :change="changePercent('completion_rate')"
        :icon="CheckCircleIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        class="w-[82vw] max-w-[19rem] shrink-0 snap-center md:w-auto md:max-w-none"
        title="Cancellations"
        :value="summary?.cancelled_orders ?? '-'"
        :change="cancelChange"
        :icon="XCircleIcon"
        :loading="analyticsStore.loading"
        lower-is-better
      />
      </div>

      <div class="mt-2 flex items-center justify-center gap-1.5 md:hidden" aria-label="Analytics metric carousel pages">
        <button
          v-for="i in 7"
          :key="i"
          type="button"
          :class="[
            'h-1.5 rounded-full transition-all duration-200',
            activeMetric === i - 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'
          ]"
          :aria-label="`Show analytics metric ${i} of 7`"
          :aria-current="activeMetric === i - 1 ? 'true' : undefined"
          @click="scrollToMetric(i - 1)"
        />
      </div>
    </section>

    <!-- Primary reports: swipeable on mobile, balanced two-column row on desktop. -->
    <div
      ref="reportScroller"
      class="scrollbar-hide -mx-3 mb-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0"
      :class="accessStore.can('analytics.view_employees') ? 'lg:grid-cols-2' : 'lg:grid-cols-1'"
      role="region"
      aria-label="Employee and financial performance reports"
      @scroll.passive="updateActiveReport"
    >
      <section
        v-if="accessStore.can('analytics.view_employees')"
        class="w-[88vw] max-w-[38rem] shrink-0 snap-center overflow-hidden rounded-xl border border-gray-100 bg-white lg:w-auto lg:max-w-none lg:min-w-0"
      >
        <div class="border-b border-slate-100 px-3 py-2 sm:flex sm:items-center sm:gap-2">
          <div class="min-w-0 flex-1">
            <h3 class="text-xs font-bold text-slate-800">Employee performance</h3>
            <p class="hidden text-[10px] text-slate-400 sm:block">Online orders and POS sales attributed to each staff account.</p>
          </div>
          <div class="mt-2 grid grid-cols-[minmax(0,1fr)_112px] gap-2 sm:mt-0 sm:flex sm:shrink-0">
            <input v-model="employeeSearch" class="owner-input !min-h-8 min-w-0 !rounded-lg !py-1.5 !text-xs sm:w-40" placeholder="Find employee" />
            <QeSelect v-model="employeeSort" size="sm" class="!w-full sm:!w-32" :options="employeeSortOptions" />
          </div>
        </div>
        <div class="max-h-64 overflow-auto">
          <table class="w-full min-w-full text-left text-[11px] lg:min-w-[760px]">
            <thead class="sticky top-0 bg-slate-50 text-[9px] uppercase tracking-wide text-slate-400">
              <tr><th class="px-3 py-1.5">Employee</th><th class="px-1.5 py-1.5 text-right">Sales</th><th class="hidden px-2 py-1.5 text-right lg:table-cell">Online</th><th class="hidden px-2 py-1.5 text-right lg:table-cell">POS</th><th class="px-1.5 py-1.5 text-right">Revenue</th><th class="hidden px-2 py-1.5 text-right lg:table-cell">Avg sale</th><th class="px-2 py-1.5 text-right">Completion</th><th class="hidden px-3 py-1.5 text-right lg:table-cell">Cancelled / void</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="employee in visibleEmployees" :key="employee.user_id" class="hover:bg-slate-50/70">
                <td class="px-3 py-2"><div class="flex items-center gap-1.5"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-[9px] font-black text-primary">{{ employeeInitials(employee.name) }}</span><span class="min-w-0"><span class="block truncate font-bold text-slate-800">{{ employee.name }}</span><span class="block truncate text-[9px] text-slate-400">{{ employee.job_title || 'Staff' }} · {{ employee.is_active ? 'Active' : 'Suspended' }}</span></span></div></td>
                <td class="px-1.5 py-2 text-right font-bold text-slate-700">{{ employee.total_sales }}</td>
                <td class="hidden px-2 py-2 text-right text-slate-500 lg:table-cell">{{ employee.online_orders }}</td>
                <td class="hidden px-2 py-2 text-right text-slate-500 lg:table-cell">{{ employee.pos_sales }}</td>
                <td class="whitespace-nowrap px-1.5 py-2 text-right font-black text-slate-900">KES {{ employee.revenue.toLocaleString() }}</td>
                <td class="hidden px-2 py-2 text-right text-slate-600 lg:table-cell">KES {{ employee.avg_sale.toLocaleString() }}</td>
                <td class="px-2 py-2 text-right"><span class="rounded-full px-1.5 py-0.5 font-bold" :class="employee.completion_rate >= 80 ? 'bg-emerald-50 text-emerald-700' : employee.completion_rate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">{{ employee.completion_rate.toFixed(1) }}%</span></td>
                <td class="hidden px-3 py-2 text-right font-bold text-slate-600 lg:table-cell">{{ employee.cancelled_or_voided }}</td>
              </tr>
              <tr v-if="!visibleEmployees.length"><td colspan="8" class="px-3 py-8 text-center text-xs text-slate-400">No employee activity in this period</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        class="w-[88vw] max-w-[38rem] shrink-0 snap-center rounded-xl border border-gray-100 bg-white p-3.5 lg:w-auto lg:max-w-none lg:min-w-0"
      >
        <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 class="text-xs font-semibold text-gray-700">Sales, expenses &amp; variance</h3>
            <p class="mt-0.5 text-[11px] text-gray-400">Variance is sales minus the expenses recorded for each day.</p>
          </div>
          <div v-if="financial" class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <span class="rounded-full bg-emerald-50 px-2 py-1">Online {{ financial.online_orders }}</span>
            <span class="rounded-full bg-blue-50 px-2 py-1">POS {{ financial.pos_sales }}</span>
          </div>
        </div>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Line v-else-if="financialChartData" :data="financialChartData" :options="financialLineOptions" class="max-h-48" />
        <p v-else class="py-10 text-center text-xs text-gray-400">No data</p>
        <p class="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] leading-4 text-slate-500">
          Estimated result uses recorded expenses only. Missing stock costs, wages, rent, tax, or other costs will make it look higher than the business's actual profit.
        </p>
      </section>
    </div>

    <div
      v-if="reportCount > 1"
      class="-mt-1 mb-3 flex items-center justify-center gap-1.5 lg:hidden"
      aria-label="Performance report carousel pages"
    >
      <button
        v-for="i in reportCount"
        :key="i"
        type="button"
        :class="[
          'h-1.5 rounded-full transition-all duration-200',
          activeReport === i - 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'
        ]"
        :aria-label="`Show performance report ${i} of ${reportCount}`"
        :aria-current="activeReport === i - 1 ? 'true' : undefined"
        @click="scrollToReport(i - 1)"
      />
    </div>

    <!-- Breakdown cards: swipeable on mobile, 4-column grid on desktop -->
    <div
      ref="breakdownScroller"
      class="scrollbar-hide -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0"
      role="region"
      aria-label="Expense, payment, and product breakdowns"
      @scroll.passive="updateActiveBreakdown"
    >
      <!-- Expense mix -->
      <div class="w-[82vw] max-w-[19rem] min-w-0 shrink-0 snap-center rounded-xl border border-gray-100 bg-white p-3.5 md:w-auto md:max-w-none">
        <h3 class="mb-2 text-xs font-semibold text-gray-700">Where expenses went</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <div v-else-if="financial?.by_category.length" class="space-y-2">
          <div v-for="item in financial.by_category" :key="item.category">
            <div class="mb-1 flex items-center justify-between gap-2 text-xs">
              <span class="truncate text-slate-600">{{ expenseCategoryLabel(item.category) }}</span>
              <span class="shrink-0 font-semibold text-slate-900">KES {{ item.total.toLocaleString() }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-orange-400" :style="{ width: `${expenseCategoryShare(item.total)}%` }" />
            </div>
          </div>
        </div>
        <p v-else class="py-10 text-center text-xs text-gray-400">No expenses recorded in this period</p>
      </div>

      <!-- Payment methods donut -->
      <div class="w-[82vw] max-w-[19rem] min-w-0 shrink-0 snap-center rounded-xl border border-gray-100 bg-white p-3.5 md:w-auto md:max-w-none">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Payment Methods</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <div v-else-if="paymentChartData" class="flex min-w-0 items-center gap-3">
          <Doughnut :data="paymentChartData" :options="doughnutOptions" class="max-h-36 max-w-[136px] shrink-0" />
          <div class="min-w-0 flex-1 space-y-1.5">
            <div v-for="(method, i) in analyticsStore.paymentMethods" :key="method.method" class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: paymentColors[i % paymentColors.length] }" />
                <span class="text-gray-600 ">{{ paymentLabel(method.method) }}</span>
              </div>
              <span class="font-medium text-gray-900 ">{{ method.percentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>

      <!-- Top products by revenue -->
      <div class="w-[82vw] max-w-[19rem] min-w-0 shrink-0 snap-center rounded-xl border border-gray-100 bg-white p-3.5 md:w-auto md:max-w-none">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Top Products by Revenue</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Bar v-else-if="topRevenueChartData" :data="topRevenueChartData" :options="horizontalBarOptions" class="max-h-40" />
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>

      <!-- Top products by volume -->
      <div class="w-[82vw] max-w-[19rem] min-w-0 shrink-0 snap-center rounded-xl border border-gray-100 bg-white p-3.5 md:w-auto md:max-w-none">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Top Products by Volume</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Bar v-else-if="topVolumeChartData" :data="topVolumeChartData" :options="horizontalBarOptions" class="max-h-40" />
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>
    </div>

    <div class="mt-2 mb-3 flex items-center justify-center gap-1.5 md:hidden" aria-label="Breakdown carousel pages">
      <button
        v-for="i in 4"
        :key="i"
        type="button"
        :class="[
          'h-1.5 rounded-full transition-all duration-200',
          activeBreakdown === i - 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'
        ]"
        :aria-label="`Show breakdown card ${i} of 4`"
        :aria-current="activeBreakdown === i - 1 ? 'true' : undefined"
        @click="scrollToBreakdown(i - 1)"
      />
    </div>

    <!-- Peak hours -->
    <div class="-mx-3 overflow-x-auto px-3 sm:-mx-4 sm:px-4 md:mx-0 md:overflow-visible md:px-0">
      <div class="min-w-[680px] rounded-xl border border-gray-100 bg-white p-3.5 md:min-w-0">
        <h3 class="text-xs font-semibold text-gray-700 mb-2">Peak Sales Hours</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Bar v-else-if="peakHoursChartData" :data="peakHoursChartData" :options="barOptions" class="h-40 max-h-40" />
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import {
  BanknotesIcon, ShoppingCartIcon, CheckCircleIcon, XCircleIcon,
  CurrencyDollarIcon, ReceiptRefundIcon, ScaleIcon, CubeIcon, ChartBarIcon,
} from '@heroicons/vue/24/outline'
import { QeSelect, QeDatePicker } from '@qesuite/ui'
import KpiCard from '@/components/dashboard/KpiCard.vue'
import { useAnalyticsStore } from '@/stores/analytics'
import { useAccessStore } from '@/stores/access'
import { useSnapCarousel } from '@/composables/useSnapCarousel'
import type { DateRange } from '@/stores/analytics'
import { EXPENSE_CATEGORIES } from '@qesuite/shared'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const employeeSortOptions = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'sales', label: 'Sales' },
  { value: 'completion', label: 'Completion' },
]

const analyticsStore = useAnalyticsStore()
const accessStore = useAccessStore()
const {
  scroller: metricScroller,
  activeIndex: activeMetric,
  updateActiveIndex: updateActiveMetric,
  scrollToIndex: scrollToMetric,
} = useSnapCarousel()
const {
  scroller: reportScroller,
  activeIndex: activeReport,
  updateActiveIndex: updateActiveReport,
  scrollToIndex: scrollToReport,
} = useSnapCarousel()
const reportCount = computed(() => accessStore.can('analytics.view_employees') ? 2 : 1)
const {
  scroller: breakdownScroller,
  activeIndex: activeBreakdown,
  updateActiveIndex: updateActiveBreakdown,
  scrollToIndex: scrollToBreakdown,
} = useSnapCarousel()

const ranges = [
  { value: 'today' as DateRange, label: 'Today' },
  { value: 'week' as DateRange, label: 'Week' },
  { value: 'month' as DateRange, label: 'Month' },
  { value: 'custom' as DateRange, label: 'Custom' },
]

const customFrom = ref('')
const customTo = ref('')
const employeeSearch = ref('')
const employeeSort = ref<'revenue' | 'sales' | 'completion'>('revenue')

const paymentColors = ['#10b981', '#0d9488', '#6366f1', '#f59e0b', '#ef4444']

const summary = computed(() => analyticsStore.summary)
const financial = computed(() => analyticsStore.financialPerformance)
const visibleEmployees = computed(() => {
  const query = employeeSearch.value.trim().toLowerCase()
  return analyticsStore.employeePerformance
    .filter(employee => !query || employee.name.toLowerCase().includes(query) || employee.job_title?.toLowerCase().includes(query))
    .slice()
    .sort((a, b) => employeeSort.value === 'sales'
      ? b.total_sales - a.total_sales
      : employeeSort.value === 'completion'
        ? b.completion_rate - a.completion_rate
        : b.revenue - a.revenue)
})

function employeeInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?'
}

function changePercent(field: 'total_revenue' | 'total_orders' | 'avg_order_value' | 'completion_rate') {
  const s = analyticsStore.summary
  if (!s || !s.prev) return undefined
  const curr = s[field] as number
  const prev = s.prev[field] as number
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
}

const cancelChange = computed(() => {
  const s = analyticsStore.summary
  if (!s || !s.prev) return undefined
  const curr = s.cancelled_orders
  const prev = s.prev.cancelled_orders
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
})

function financialChange(field: 'cogs' | 'gross_profit' | 'expenses' | 'variance' | 'net_profit') {
  const data = financial.value
  if (!data) return undefined
  const current = data[field]
  const previous = data.previous[field]
  if (previous === 0) return current === 0 ? 0 : current > 0 ? 100 : -100
  return ((current - previous) / Math.abs(previous)) * 100
}

function formatSignedKes(value: number) {
  return value < 0 ? `-KES ${Math.abs(value).toLocaleString()}` : `KES ${value.toLocaleString()}`
}

function expenseCategoryLabel(category: string) {
  return EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES]?.label ?? category
}

function expenseCategoryShare(total: number) {
  const expenseTotal = financial.value?.expenses ?? 0
  return expenseTotal > 0 ? Math.max(2, Math.round((total / expenseTotal) * 100)) : 0
}

function paymentLabel(m: string) {
  const labels: Record<string, string> = {
    cash: 'Cash',
    pay_on_delivery: 'Pay on Delivery',
    mpesa: 'M-Pesa',
    stripe: 'Card'
  }
  return labels[m] || m
}

const financialChartData = computed(() => {
  const data = financial.value?.daily ?? []
  if (!data.length) return null
  return {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Sales',
        data: data.map(d => d.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: 'Expenses',
        data: data.map(d => d.expenses),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: 'Variance',
        data: data.map(d => d.variance),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.08)',
        borderDash: [5, 4],
        tension: 0.35,
        pointRadius: 2,
      },
    ]
  }
})

const paymentChartData = computed(() => {
  const data = analyticsStore.paymentMethods
  if (!data.length) return null
  return {
    labels: data.map(d => paymentLabel(d.method)),
    datasets: [{
      data: data.map(d => d.percentage),
      backgroundColor: paymentColors,
      borderWidth: 0,
      hoverOffset: 4
    }]
  }
})

const topRevenueChartData = computed(() => {
  const data = analyticsStore.topProductsByRevenue
  if (!data.length) return null
  return {
    labels: data.map(d => d.product_name),
    datasets: [{
      label: 'Revenue (KES)',
      data: data.map(d => d.total_revenue),
      backgroundColor: '#10b981',
      borderRadius: 6
    }]
  }
})

const topVolumeChartData = computed(() => {
  const data = analyticsStore.topProductsByVolume
  if (!data.length) return null
  return {
    labels: data.map(d => d.product_name),
    datasets: [{
      label: 'Units sold',
      data: data.map(d => d.total_quantity),
      backgroundColor: '#0d9488',
      borderRadius: 6
    }]
  }
})

const peakHoursChartData = computed(() => {
  const data = analyticsStore.peakHours
  if (!data.length) return null
  return {
    labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    datasets: [{
      label: 'Sales',
      data: Array.from({ length: 24 }, (_, h) => data.find(d => d.hour === h)?.orders || 0),
      backgroundColor: data.map((_, i) => {
        const v = data[i]?.orders || 0
        const max = Math.max(...data.map(d => d.orders))
        const opacity = 0.3 + (v / max) * 0.7
        return `rgba(16,185,129,${opacity})`
      }),
      borderRadius: 4
    }]
  }
})

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db',
      padding: 10,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af', font: { size: 11 } }
    },
    y: {
      grid: { color: 'rgba(156,163,175,0.1)' },
      ticks: { color: '#9ca3af', font: { size: 11 } }
    }
  }
}

const financialLineOptions = {
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { usePointStyle: true, boxWidth: 7, padding: 12, color: '#64748b', font: { size: 10 } },
    },
  },
}
const barOptions = { ...baseChartOptions }
const horizontalBarOptions = {
  ...baseChartOptions,
  indexAxis: 'y' as const,
  scales: {
    x: { ...baseChartOptions.scales.x },
    y: { ...baseChartOptions.scales.y, grid: { display: false } }
  }
}
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db',
      padding: 10,
      cornerRadius: 8
    }
  },
  cutout: '70%'
}

function setRange(r: DateRange) {
  if (r !== 'custom') {
    analyticsStore.setDateRange(r)
  } else {
    // Just switch to custom mode without fetching — user will click Apply
    analyticsStore.dateRange = r
  }
}

function applyCustom() {
  if (customFrom.value && customTo.value) {
    analyticsStore.setDateRange('custom', customFrom.value, customTo.value)
  }
}

onMounted(() => analyticsStore.fetchAll())
</script>
