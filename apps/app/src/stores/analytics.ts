import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetFinancialPerformance,
  apiGetTopProducts,
  apiGetPeakHours,
  apiGetPaymentMethods,
  apiGetEmployeePerformance
} from '@/api/analytics'
import type { AnalyticsSummary, EmployeePerformance, TopProduct } from '@qesuite/types'
import type { FinancialPeriodSummary, FinancialPerformance, PeakHour, PaymentMethodBreakdown } from '@/api/analytics'
import { useToast } from '@/composables/useToast'
import { useAccessStore } from '@/stores/access'

export type DateRange = 'today' | 'week' | 'month' | 'custom'

export const useAnalyticsStore = defineStore('analytics', () => {
  const dateRange = ref<DateRange>('month')
  const customFrom = ref<string>('')
  const customTo = ref<string>('')

  const summary = ref<(AnalyticsSummary & { prev: AnalyticsSummary }) | null>(null)
  const financialPerformance = ref<FinancialPerformance | null>(null)
  const topProductsByRevenue = ref<TopProduct[]>([])
  const topProductsByVolume = ref<TopProduct[]>([])
  const peakHours = ref<PeakHour[]>([])
  const paymentMethods = ref<PaymentMethodBreakdown[]>([])
  const employeePerformance = ref<EmployeePerformance[]>([])

  const loading = ref(false)
  const { showToast } = useToast()

  function getParams() {
    if (dateRange.value === 'custom') {
      return { from: customFrom.value, to: customTo.value }
    }
    return { period: dateRange.value as 'today' | 'week' | 'month' }
  }

  // /api/analytics/profit-loss already computes everything /api/analytics/summary
  // does (both call the same underlying sales-summary query) and now returns
  // those fields too — deriving `summary` from it avoids a second, redundant
  // round trip + duplicate D1 queries on every dashboard load.
  function toSummary(period: FinancialPeriodSummary): AnalyticsSummary {
    return {
      total_orders: period.total_orders,
      total_revenue: period.revenue,
      avg_order_value: period.avg_order_value,
      cancelled_orders: period.cancelled_orders,
      completion_rate: period.completion_rate,
      online_orders: period.online_orders,
      pos_sales: period.pos_sales,
      period_days: period.period_days,
    }
  }

  async function fetchAll() {
    loading.value = true
    const params = getParams()
    try {
      const accessStore = useAccessStore()
      const [financialRes, topRes, peakRes, paymentRes, employeesRes] = await Promise.allSettled([
        apiGetFinancialPerformance(params),
        apiGetTopProducts({ ...params }),
        apiGetPeakHours(params),
        apiGetPaymentMethods(params),
        accessStore.can('analytics.view_employees') ? apiGetEmployeePerformance(params) : Promise.resolve(null),
      ])

      if (financialRes.status === 'fulfilled' && financialRes.value.success && financialRes.value.data) {
        financialPerformance.value = financialRes.value.data
        summary.value = { ...toSummary(financialRes.value.data), prev: toSummary(financialRes.value.data.previous) }
      }
      if (topRes.status === 'fulfilled' && topRes.value.success) {
        topProductsByRevenue.value = (topRes.value.data?.by_revenue ?? []).slice(0, 5)
        topProductsByVolume.value = (topRes.value.data?.by_volume ?? []).slice(0, 5)
      }
      if (peakRes.status === 'fulfilled' && peakRes.value.success) peakHours.value = peakRes.value.data ?? []
      if (paymentRes.status === 'fulfilled' && paymentRes.value.success) paymentMethods.value = paymentRes.value.data ?? []
      if (employeesRes.status === 'fulfilled' && employeesRes.value?.success) employeePerformance.value = employeesRes.value.data ?? []
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
    financialPerformance,
    topProductsByRevenue,
    topProductsByVolume,
    peakHours,
    paymentMethods,
    employeePerformance,
    loading,
    fetchAll,
    setDateRange
  }
})
