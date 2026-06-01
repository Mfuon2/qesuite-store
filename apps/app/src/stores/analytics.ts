import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetAnalyticsSummary,
  apiGetRevenueChart,
  apiGetTopProducts,
  apiGetPeakHours,
  apiGetPaymentMethods
} from '@/api/analytics'
import type { AnalyticsSummary, RevenueDataPoint, TopProduct } from '@qesuite/types'
import type { PeakHour, PaymentMethodBreakdown } from '@/api/analytics'
import { useToast } from '@/composables/useToast'

export type DateRange = 'today' | 'week' | 'month' | 'custom'

export const useAnalyticsStore = defineStore('analytics', () => {
  const dateRange = ref<DateRange>('month')
  const customFrom = ref<string>('')
  const customTo = ref<string>('')

  const summary = ref<(AnalyticsSummary & { prev: AnalyticsSummary }) | null>(null)
  const revenueChart = ref<RevenueDataPoint[]>([])
  const topProductsByRevenue = ref<TopProduct[]>([])
  const topProductsByVolume = ref<TopProduct[]>([])
  const peakHours = ref<PeakHour[]>([])
  const paymentMethods = ref<PaymentMethodBreakdown[]>([])

  const loading = ref(false)
  const { showToast } = useToast()

  function getParams() {
    if (dateRange.value === 'custom') {
      return { from: customFrom.value, to: customTo.value }
    }
    return { period: dateRange.value as 'today' | 'week' | 'month' }
  }

  async function fetchAll() {
    loading.value = true
    const params = getParams()
    try {
      const [summaryRes, revenueRes, topRes, peakRes, paymentRes] = await Promise.allSettled([
        apiGetAnalyticsSummary(params),
        apiGetRevenueChart(params),
        apiGetTopProducts({ ...params }),
        apiGetPeakHours(params),
        apiGetPaymentMethods(params)
      ])

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) summary.value = summaryRes.value.data ?? null
      if (revenueRes.status === 'fulfilled' && revenueRes.value.success) revenueChart.value = revenueRes.value.data ?? []
      if (topRes.status === 'fulfilled' && topRes.value.success) {
        topProductsByRevenue.value = (topRes.value.data?.by_revenue ?? []).slice(0, 5)
        topProductsByVolume.value = (topRes.value.data?.by_volume ?? []).slice(0, 5)
      }
      if (peakRes.status === 'fulfilled' && peakRes.value.success) peakHours.value = peakRes.value.data ?? []
      if (paymentRes.status === 'fulfilled' && paymentRes.value.success) paymentMethods.value = paymentRes.value.data ?? []
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load analytics', 'error')
    } finally {
      loading.value = false
    }
  }

  async function setDateRange(range: DateRange, from?: string, to?: string) {
    dateRange.value = range
    if (range === 'custom' && from && to) {
      customFrom.value = from
      customTo.value = to
    }
    await fetchAll()
  }

  return {
    dateRange,
    customFrom,
    customTo,
    summary,
    revenueChart,
    topProductsByRevenue,
    topProductsByVolume,
    peakHours,
    paymentMethods,
    loading,
    fetchAll,
    setDateRange
  }
})
