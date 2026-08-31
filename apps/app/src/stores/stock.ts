import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetStockMovements, apiRequestStockAdjustment, apiGetStockTakeSessions, apiGetStockTakeSession,
  apiOpenStockTake, apiRecordStockTakeCounts, apiCloseStockTake,
} from '@/api/stock'
import type { StockMovement, StockTakeSession } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useStockStore = defineStore('stock', () => {
  const movements = ref<StockMovement[]>([])
  const sessions = ref<StockTakeSession[]>([])
  const activeSession = ref<StockTakeSession | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  async function fetchMovements(productId?: string) {
    loading.value = true
    try {
      const res = await apiGetStockMovements(productId)
      if (res.success && res.data) movements.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load stock movements', 'error')
    } finally { loading.value = false }
  }

  async function requestAdjustment(payload: { product_id: string; quantity_delta: number; reason: string }): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiRequestStockAdjustment(payload)
      if (res.success) { showToast('Adjustment submitted for approval', 'success'); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to submit adjustment', 'error')
      return false
    } finally { saving.value = false }
  }

  async function fetchSessions() {
    loading.value = true
    try {
      const res = await apiGetStockTakeSessions()
      if (res.success && res.data) {
        sessions.value = res.data
        const open = res.data.find(s => s.status === 'open')
        activeSession.value = open ? await loadSession(open.id) : null
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load stock-take sessions', 'error')
    } finally { loading.value = false }
  }

  async function loadSession(id: string): Promise<StockTakeSession | null> {
    const res = await apiGetStockTakeSession(id)
    return res.success && res.data ? res.data : null
  }

  async function openSession(notes?: string): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiOpenStockTake(notes)
      if (res.success && res.data) {
        showToast('Stock-take opened', 'success')
        activeSession.value = await loadSession(res.data.id)
        await fetchSessions()
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to open stock-take', 'error')
      return false
    } finally { saving.value = false }
  }

  async function recordCounts(sessionId: string, counts: { product_id: string; counted_quantity: number; reason?: string }[]): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiRecordStockTakeCounts(sessionId, counts)
      if (res.success) {
        showToast('Counts saved', 'success')
        activeSession.value = await loadSession(sessionId)
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save counts', 'error')
      return false
    } finally { saving.value = false }
  }

  async function closeSession(sessionId: string): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiCloseStockTake(sessionId)
      if (res.success) {
        showToast(`Stock-take closed — ${res.data?.corrections ?? 0} correction(s) applied`, 'success')
        activeSession.value = null
        await fetchSessions()
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to close stock-take', 'error')
      return false
    } finally { saving.value = false }
  }

  return {
    movements, sessions, activeSession, loading, saving,
    fetchMovements, requestAdjustment, fetchSessions, openSession, recordCounts, closeSession,
  }
})
