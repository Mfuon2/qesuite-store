import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetProducts } from '@/api/products'
import {
  apiGetPosSales, apiGetPosSale, apiCreatePosSale, apiVoidPosSale, apiGetPosReport,
  apiGetCurrentTill, apiGetTillHistory, apiOpenTill, apiRecordCashMovement, apiCloseTill,
  type PosSaleResult, type PosSalePendingApproval, type PosReport, type PosTillCloseResult
} from '@/api/pos'
import type {
  Product,
  PosCashMovementType,
  PosSale,
  PosSaleItem,
  PosSaleCreate,
  PosTillSession,
} from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const usePosStore = defineStore('pos', () => {
  const menuProducts = ref<Product[]>([])
  const sales = ref<PosSale[]>([])
  const currentSale = ref<{ sale: PosSale; items: PosSaleItem[] } | null>(null)
  const report = ref<PosReport | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const till = ref<PosTillSession | null>(null)
  const tillHistory = ref<PosTillSession[]>([])
  const tillLoaded = ref(false)
  const tillSaving = ref(false)
  const total = ref(0)
  const { showToast } = useToast()

  // POS needs the whole active catalog in memory (not the paginated 50-item default
  // used by the Products page), so this fetches directly rather than via useProductsStore.
  async function fetchMenuProducts() {
    loading.value = true
    try {
      const res = (await apiGetProducts({ limit: 100 })) as unknown as { data: { items: Product[]; total: number } | null }
      menuProducts.value = res.data?.items || []
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load products', 'error')
    } finally {
      loading.value = false
    }
  }

  async function fetchSales(params?: { status?: string; from?: string; to?: string; page?: number }) {
    loading.value = true
    try {
      const res = await apiGetPosSales(params)
      sales.value = res.items
      total.value = res.total
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load sales', 'error')
    } finally {
      loading.value = false
    }
  }

  async function fetchSale(id: string) {
    try {
      const res = await apiGetPosSale(id)
      currentSale.value = res
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load sale', 'error')
    }
  }

  async function createSale(payload: PosSaleCreate): Promise<PosSaleResult | PosSalePendingApproval | null> {
    saving.value = true
    try {
      const res = await apiCreatePosSale(payload)
      if (res.data && 'pending_approval' in res.data) {
        showToast(res.error ?? `Sent for manager approval — exceeds ${res.data.customer_name}'s credit limit`, 'warning')
        return res.data
      }
      if (res.data) {
        await fetchTill()
        showToast(`Sale ${res.data.receipt_code} recorded`, 'success')
        return res.data
      }
      return null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to record sale', 'error')
      return null
    } finally {
      saving.value = false
    }
  }

  async function voidSale(id: string, reason: string): Promise<boolean> {
    try {
      await apiVoidPosSale(id, reason)
      const idx = sales.value.findIndex(s => s.id === id)
      if (idx !== -1) sales.value[idx] = { ...sales.value[idx], status: 'voided', void_reason: reason }
      await fetchTill()
      showToast('Sale voided', 'success')
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to void sale', 'error')
      return false
    }
  }

  async function fetchTill(): Promise<PosTillSession | null> {
    try {
      till.value = await apiGetCurrentTill()
      return till.value
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load the POS till', 'error')
      return null
    } finally {
      tillLoaded.value = true
    }
  }

  async function fetchTillHistory() {
    try {
      tillHistory.value = await apiGetTillHistory()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load till history', 'error')
    }
  }

  async function openTill(openingFloat: number, businessDate: string): Promise<boolean> {
    tillSaving.value = true
    try {
      const response = await apiOpenTill({ opening_float: openingFloat, business_date: businessDate })
      if (!response.data) return false
      till.value = response.data
      await fetchTill()
      tillLoaded.value = true
      showToast(`Till opened with KES ${openingFloat.toLocaleString()}`, 'success')
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to open the POS till', 'error')
      return false
    } finally {
      tillSaving.value = false
    }
  }

  async function recordCashMovement(
    movementType: Extract<PosCashMovementType, 'paid_in' | 'paid_out' | 'correction'>,
    amount: number,
    reason: string,
    expense?: { recordAsExpense: boolean; category?: string },
  ): Promise<boolean> {
    tillSaving.value = true
    try {
      const response = await apiRecordCashMovement({
        movement_type: movementType,
        amount,
        reason,
        record_as_expense: expense?.recordAsExpense,
        expense_category: expense?.recordAsExpense ? expense.category : undefined,
      })
      if (!response.data) return false
      till.value = response.data
      await fetchTill()
      showToast(expense?.recordAsExpense ? 'Cash taken out and expense saved' : 'Cash change saved', 'success')
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save the cash change', 'error')
      return false
    } finally {
      tillSaving.value = false
    }
  }

  async function closeTill(countedCash: number): Promise<PosTillCloseResult | null> {
    tillSaving.value = true
    try {
      const response = await apiCloseTill(countedCash)
      if (!response.data) return null
      till.value = null
      const varianceText = response.data.variance === 0
        ? 'cash matched the expected amount'
        : `KES ${Math.abs(response.data.variance).toLocaleString()} ${response.data.variance > 0 ? 'more' : 'less'} than expected`
      showToast(`Till closed — ${varianceText}`, response.data.variance === 0 ? 'success' : 'info')
      return response.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to close the POS till', 'error')
      return null
    } finally {
      tillSaving.value = false
    }
  }

  async function fetchReport(params?: { period?: string; from?: string; to?: string }) {
    loading.value = true
    try {
      const res = await apiGetPosReport(params)
      if (res.data) report.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load sales report', 'error')
    } finally {
      loading.value = false
    }
  }

  return {
    menuProducts,
    sales,
    currentSale,
    report,
    loading,
    saving,
    till,
    tillHistory,
    tillLoaded,
    tillSaving,
    total,
    fetchMenuProducts,
    fetchSales,
    fetchSale,
    createSale,
    voidSale,
    fetchReport,
    fetchTill,
    fetchTillHistory,
    openTill,
    recordCashMovement,
    closeTill,
  }
})
