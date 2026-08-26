import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetAnalyticsSummary,
  apiGetFinancialPerformance,
  apiGetTopProducts,
  apiGetPeakHours,
  apiGetPaymentMethods,
  apiGetEmployeePerformance
} from '@/api/analytics'
import type { AnalyticsSummary, EmployeePerformance, TopProduct } from '@qesuite/types'
import type { FinancialPerformance, PeakHour, PaymentMethodBreakdown } from '@/api/analytics'
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

  async function fetchAll() {
    loading.value = true
    const params = getParams()
    try {
      const accessStore = useAccessStore()
      const [summaryRes, financialRes, topRes, peakRes, paymentRes, employeesRes] = await Promise.allSettled([
        apiGetAnalyticsSummary(params),
        apiGetFinancialPerformance(params),
        apiGetTopProducts({ ...params }),
        apiGetPeakHours(params),
        apiGetPaymentMethods(params),
        accessStore.can('analytics.view_employees') ? apiGetEmployeePerformance(params) : Promise.resolve(null),
      ])

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) summary.value = summaryRes.value.data ?? null
      if (financialRes.status === 'fulfilled' && financialRes.value.success) financialPerformance.value = financialRes.value.data ?? null
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
