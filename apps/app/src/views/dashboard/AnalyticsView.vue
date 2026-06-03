<template>
  <div class="p-3 sm:p-4">
    <!-- Header + date range -->
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <h2 class="text-base font-bold text-gray-900 ">Analytics</h2>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex rounded-xl border border-gray-200  overflow-hidden text-sm">
          <button
            v-for="r in ranges"
            :key="r.value"
            @click="setRange(r.value)"
            :class="['px-3 py-2 font-medium transition-colors', analyticsStore.dateRange === r.value ? 'bg-primary text-white' : 'text-gray-500  hover:bg-gray-50 ']"
          >
            {{ r.label }}
          </button>
        </div>
        <!-- Custom date range -->
        <template v-if="analyticsStore.dateRange === 'custom'">
          <input type="date" v-model="customFrom" class="px-3 py-2 text-sm rounded-xl border border-gray-200  bg-white  text-gray-900  focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="date" v-model="customTo" class="px-3 py-2 text-sm rounded-xl border border-gray-200  bg-white  text-gray-900  focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button @click="applyCustom" class="px-3 py-2 text-sm bg-primary text-white rounded-xl hover:opacity-90">Apply</button>
        </template>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
      <KpiCard
        title="Revenue"
        :value="summary ? `KES ${summary.total_revenue.toLocaleString()}` : '-'"
        :change="changePercent('total_revenue')"
        :icon="BanknotesIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        title="Orders"
        :value="summary?.total_orders ?? '-'"
        :change="changePercent('total_orders')"
        :icon="ShoppingCartIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        title="Avg. Order"
        :value="summary ? `KES ${summary.avg_order_value.toLocaleString()}` : '-'"
        :change="changePercent('avg_order_value')"
        :icon="CurrencyDollarIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        title="Completion Rate"
        :value="summary ? `${summary.completion_rate.toFixed(1)}%` : '-'"
        :change="changePercent('completion_rate')"
        :icon="CheckCircleIcon"
        :loading="analyticsStore.loading"
      />
      <KpiCard
        title="Cancellations"
        :value="summary?.cancelled_orders ?? '-'"
        :change="cancelChange"
        :icon="XCircleIcon"
        :loading="analyticsStore.loading"
      />
    </div>

    <!-- Charts grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <!-- Revenue over time -->
      <div class="bg-white  rounded-xl border border-gray-100  p-3.5">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Daily Revenue</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Line v-else-if="revenueChartData" :data="revenueChartData" :options="lineOptions" class="max-h-40" />
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>

      <!-- Payment methods donut -->
      <div class="bg-white  rounded-xl border border-gray-100  p-3.5">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Payment Methods</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <div v-else-if="paymentChartData" class="flex items-center gap-4">
          <Doughnut :data="paymentChartData" :options="doughnutOptions" class="max-h-36 max-w-[144px]" />
          <div class="flex-1 space-y-1.5">
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
      <div class="bg-white  rounded-xl border border-gray-100  p-3.5">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Top Products by Revenue</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Bar v-else-if="topRevenueChartData" :data="topRevenueChartData" :options="horizontalBarOptions" class="max-h-40" />
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>

      <!-- Top products by volume -->
      <div class="bg-white  rounded-xl border border-gray-100  p-3.5">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Top Products by Volume</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Bar v-else-if="topVolumeChartData" :data="topVolumeChartData" :options="horizontalBarOptions" class="max-h-40" />
        <p v-else class="text-center text-gray-400 py-10 text-xs">No data</p>
      </div>

      <!-- Peak hours -->
      <div class="lg:col-span-2 bg-white  rounded-xl border border-gray-100  p-3.5">
        <h3 class="text-xs font-semibold text-gray-700  mb-2">Peak Order Hours</h3>
        <div v-if="analyticsStore.loading" class="skeleton h-36 rounded-lg" />
        <Bar v-else-if="peakHoursChartData" :data="peakHoursChartData" :options="barOptions" class="max-h-40" />
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
import { BanknotesIcon, ShoppingCartIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon } from '@heroicons/vue/24/outline'
import KpiCard from '@/components/dashboard/KpiCard.vue'
import { useAnalyticsStore } from '@/stores/analytics'
import type { DateRange } from '@/stores/analytics'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const analyticsStore = useAnalyticsStore()

const ranges = [
  { value: 'today' as DateRange, label: 'Today' },
  { value: 'week' as DateRange, label: 'Week' },
  { value: 'month' as DateRange, label: 'Month' },
  { value: 'custom' as DateRange, label: 'Custom' },
]

const customFrom = ref('')
const customTo = ref('')

const paymentColors = ['#10b981', '#0d9488', '#6366f1', '#f59e0b', '#ef4444']

const summary = computed(() => analyticsStore.summary)

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
  if (prev === 0) return 0
  // Inverse: more cancellations = negative
  return -((curr - prev) / prev) * 100
})

function paymentLabel(m: string) {
  const labels: Record<string, string> = {
    pay_on_delivery: 'Pay on Delivery',
    mpesa: 'M-Pesa',
    stripe: 'Card'
  }
  return labels[m] || m
}

const revenueChartData = computed(() => {
  const data = analyticsStore.revenueChart
  if (!data.length) return null
  return {
    labels: data.map(d => d.date),
    datasets: [{
      label: 'Revenue (KES)',
      data: data.map(d => d.revenue),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }]
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
      label: 'Orders',
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

const lineOptions = { ...baseChartOptions }
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
