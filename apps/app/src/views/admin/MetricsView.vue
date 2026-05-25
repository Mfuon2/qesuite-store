<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold text-white">Platform Metrics</h1>
        <p class="text-slate-400 text-xs">Overview of the entire QeSuite platform</p>
      </div>
      <!-- Period selector -->
      <div class="flex gap-2">
        <button
          v-for="p in periods"
          :key="p.value"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="metricsStore.period === p.value
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          @click="metricsStore.setPeriod(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <KpiCard
        v-for="kpi in kpiCards"
        :key="kpi.label"
        :label="kpi.label"
        :value="kpi.value"
        :sub="kpi.sub"
        :icon="kpi.icon"
        :color="kpi.color"
        :loading="metricsStore.loading"
      />
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- GMV over time (area) -->
      <div class="lg:col-span-2 admin-card p-4">
        <h2 class="text-xs font-semibold text-slate-300 mb-3">Platform GMV</h2>
        <div class="h-44" v-if="!metricsStore.chartLoading && metricsStore.gmvChart.length">
          <Line :data="gmvChartData" :options="lineChartOptions" />
        </div>
        <div v-else-if="metricsStore.chartLoading" class="h-44">
          <LoadingSpinner height="md" />
        </div>
        <div v-else class="h-44 flex items-center justify-center text-slate-500 text-xs">No data available</div>
      </div>

      <!-- Store status donut -->
      <div class="admin-card p-4">
        <h2 class="text-xs font-semibold text-slate-300 mb-3">Store Status</h2>
        <div v-if="!metricsStore.loading && metricsStore.metrics" class="h-44 flex items-center justify-center">
          <Doughnut :data="donutData" :options="donutOptions" />
        </div>
        <div v-else class="h-44">
          <LoadingSpinner height="md" />
        </div>
      </div>
    </div>

    <!-- New stores over time -->
    <div class="admin-card p-4">
      <h2 class="text-xs font-semibold text-slate-300 mb-3">New Stores Over Time</h2>
      <div class="h-36" v-if="!metricsStore.chartLoading && metricsStore.growthChart.length">
        <Bar :data="growthChartData" :options="barChartOptions" />
      </div>
      <div v-else-if="metricsStore.chartLoading" class="h-36">
        <LoadingSpinner height="sm" />
      </div>
      <div v-else class="h-36 flex items-center justify-center text-slate-500 text-xs">No data available</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useMetricsStore } from '@/stores/metrics'
import KpiCard from '@/components/admin/KpiCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

const metricsStore = useMetricsStore()

const periods = [
  { value: '7d' as const, label: '7d' },
  { value: '30d' as const, label: '30d' },
  { value: '90d' as const, label: '90d' },
]

const m = computed(() => metricsStore.metrics)

function formatMoney(n: number) {
  if (n >= 1_000_000) return 'KES ' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return 'KES ' + (n / 1_000).toFixed(0) + 'K'
  return 'KES ' + n.toLocaleString()
}

function pct(n: number) {
  return (n * 100).toFixed(1) + '%'
}

const kpiCards = computed(() => [
  {
    label: 'Active Stores',
    value: m.value ? m.value.active_stores.toLocaleString() : '—',
    sub: `+${m.value?.new_stores_today ?? 0} today`,
    icon: 'stores',
    color: 'indigo',
  },
  {
    label: 'Stores in Trial',
    value: m.value ? m.value.trialing_stores.toLocaleString() : '—',
    sub: `${m.value?.new_stores_this_month ?? 0} this month`,
    icon: 'trial',
    color: 'amber',
  },
  {
    label: 'Suspended',
    value: m.value ? m.value.suspended_stores.toLocaleString() : '—',
    sub: 'Need attention',
    icon: 'warning',
    color: 'red',
  },
  {
    label: 'Platform GMV',
    value: m.value ? formatMoney(m.value.platform_gmv) : '—',
    sub: `${formatMoney(m.value?.monthly_gmv ?? 0)} this month`,
    icon: 'money',
    color: 'emerald',
  },
  {
    label: 'MRR',
    value: m.value ? formatMoney(m.value.mrr) : '—',
    sub: 'Monthly recurring revenue',
    icon: 'chart',
    color: 'blue',
  },
  {
    label: 'Trial → Paid Rate',
    value: m.value ? pct(m.value.trial_to_paid_rate) : '—',
    sub: 'Conversion rate',
    icon: 'funnel',
    color: 'violet',
  },
])

// Chart data

const gmvChartData = computed(() => ({
  labels: metricsStore.gmvChart.map((d) => d.date),
  datasets: [
    {
      label: 'GMV',
      data: metricsStore.gmvChart.map((d) => d.value),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#6366f1',
    },
  ],
}))

const growthChartData = computed(() => ({
  labels: metricsStore.growthChart.map((d) => d.date),
  datasets: [
    {
      label: 'New Stores',
      data: metricsStore.growthChart.map((d) => d.count),
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderRadius: 4,
    },
  ],
}))

const donutData = computed(() => {
  const mv = m.value
  if (!mv) return { labels: [], datasets: [{ data: [] }] }
  return {
    labels: ['Active', 'Trialing', 'Suspended'],
    datasets: [
      {
        data: [
          mv.active_stores,
          mv.trialing_stores,
          mv.suspended_stores,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  }
})

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(100, 116, 139, 0.2)' },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(100, 116, 139, 0.2)' },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
  },
}

const lineChartOptions = { ...baseChartOptions }
const barChartOptions = { ...baseChartOptions }
const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { color: '#94a3b8', padding: 16, font: { size: 11 } },
    },
  },
}

onMounted(async () => {
  await Promise.all([metricsStore.fetchMetrics(), metricsStore.fetchCharts()])
})
</script>
