import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetPurchaseOrders, apiGetPurchaseOrder, apiCreatePurchaseOrder, apiUpdatePurchaseOrder,
  apiSubmitPurchaseOrder, apiApprovePurchaseOrder, apiRejectPurchaseOrder, apiSendPurchaseOrder,
  apiCancelPurchaseOrder, apiReceivePurchaseOrder,
  type PurchaseOrderInput, type ReceiveInput,
} from '@/api/purchaseOrders'
import type { PurchaseOrder } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const usePurchaseOrdersStore = defineStore('purchaseOrders', () => {
  const orders = ref<PurchaseOrder[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  async function fetchOrders(status?: string) {
    loading.value = true
    try {
      const res = await apiGetPurchaseOrders(status)
      if (res.success && res.data) orders.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load purchase orders', 'error')
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(id: string): Promise<PurchaseOrder | null> {
    try {
      const res = await apiGetPurchaseOrder(id)
      return res.success && res.data ? res.data : null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load purchase order', 'error')
      return null
    }
  }

  async function createOrder(payload: PurchaseOrderInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiCreatePurchaseOrder(payload)
      if (res.success) { showToast(`Purchase order ${res.data?.po_number} drafted`, 'success'); await fetchOrders(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to draft purchase order', 'error')
      return false
    } finally { saving.value = false }
  }

  async function updateOrder(id: string, payload: PurchaseOrderInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiUpdatePurchaseOrder(id, payload)
      if (res.success) { showToast('Purchase order updated', 'success'); await fetchOrders(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update purchase order', 'error')
      return false
    } finally { saving.value = false }
  }

  async function runAction(
    action: (id: string) => Promise<{ success: boolean; message?: string | null }>,
    id: string,
    successMessage: string,
  ): Promise<boolean> {
    saving.value = true
    try {
      const res = await action(id)
      if (res.success) { showToast(successMessage, 'success'); await fetchOrders(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error')
      return false
    } finally { saving.value = false }
  }

  const submitOrder = (id: string) => runAction(apiSubmitPurchaseOrder, id, 'Submitted for approval')
  const approveOrder = (id: string) => runAction(apiApprovePurchaseOrder, id, 'Purchase order approved')
  const sendOrder = (id: string) => runAction(apiSendPurchaseOrder, id, 'Marked as sent to supplier')
  const cancelOrder = (id: string) => runAction(apiCancelPurchaseOrder, id, 'Purchase order cancelled')

  async function rejectOrder(id: string, reason?: string): Promise<boolean> {
    return runAction((orderId) => apiRejectPurchaseOrder(orderId, reason), id, 'Purchase order rejected')
  }

  async function receiveOrder(id: string, payload: ReceiveInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiReceivePurchaseOrder(id, payload)
      if (res.success) { showToast('Stock received', 'success'); await fetchOrders(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to record stock receipt', 'error')
      return false
    } finally { saving.value = false }
  }

  return {
    orders, loading, saving,
    fetchOrders, fetchOrder, createOrder, updateOrder,
    submitOrder, approveOrder, rejectOrder, sendOrder, cancelOrder, receiveOrder,
  }
})
