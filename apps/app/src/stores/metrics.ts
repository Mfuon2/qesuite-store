import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPlatformMetrics, getGMVChart, getStoreGrowthChart } from '@/api/admin'

export interface PlatformMetrics {
  total_stores: number
  active_stores: number
  trialing_stores: number
  suspended_stores: number
  platform_gmv: number
  monthly_gmv: number
  mrr: number
  trial_to_paid_rate: number
  new_stores_today: number
  new_stores_this_month: number
}

export interface ChartDataPoint {
  date: string
  value: number
}

export interface StoreGrowthPoint {
  date: string
  count: number
  cumulative: number
}

export interface StatusBreakdown {
  status: string
  count: number
  color: string
}

export const useMetricsStore = defineStore('adminMetrics', () => {
  const metrics = ref<PlatformMetrics | null>(null)
  const gmvChart = ref<ChartDataPoint[]>([])
  const growthChart = ref<StoreGrowthPoint[]>([])
  const statusBreakdown = ref<StatusBreakdown[]>([])
  const loading = ref(false)
  const chartLoading = ref(false)
  const period = ref<'7d' | '30d' | '90d'>('30d')

  async function fetchMetrics(): Promise<void> {
    loading.value = true
    try {
      metrics.value = await getPlatformMetrics()
    } finally {
      loading.value = false
    }
  }

  async function fetchCharts(): Promise<void> {
    chartLoading.value = true
    try {
      const [gmv, growth] = await Promise.all([
        getGMVChart(period.value),
        getStoreGrowthChart(period.value),
      ])
      gmvChart.value = gmv
      growthChart.value = growth
    } finally {
      chartLoading.value = false
    }
  }

  async function setPeriod(p: '7d' | '30d' | '90d') {
    period.value = p
    await fetchCharts()
  }

  return {
    metrics,
    gmvChart,
    growthChart,
    statusBreakdown,
    loading,
    chartLoading,
    period,
    fetchMetrics,
    fetchCharts,
    setPeriod,
  }
})
