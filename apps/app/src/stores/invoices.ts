import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetInvoices, apiGetInvoice, apiGetArAging, apiCreateInvoice, apiUpdateInvoice,
  apiSendInvoice, apiVoidInvoice, apiRecordInvoicePayment, apiRequestWriteOff, apiIssueCreditNote,
  type InvoiceInput,
} from '@/api/invoices'
import type { Invoice, ArAgingRow } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref<Invoice[]>([])
  const aging = ref<ArAgingRow[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  async function fetchInvoices(filters?: { status?: string; type?: string; customer_id?: string }) {
    loading.value = true
    try {
      const res = await apiGetInvoices(filters)
      if (res.success && res.data) invoices.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load invoices', 'error')
    } finally { loading.value = false }
  }

  async function fetchAging() {
    try {
      const res = await apiGetArAging()
      if (res.success && res.data) aging.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load accounts receivable', 'error')
    }
  }

  async function fetchInvoice(id: string): Promise<Invoice | null> {
    try {
      const res = await apiGetInvoice(id)
      return res.success && res.data ? res.data : null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load invoice', 'error')
      return null
    }
  }

  async function createInvoice(payload: InvoiceInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiCreateInvoice(payload)
      if (res.success) { showToast('Draft saved', 'success'); await fetchInvoices(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save draft', 'error')
      return false
    } finally { saving.value = false }
  }

  async function updateInvoice(id: string, payload: InvoiceInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiUpdateInvoice(id, payload)
      if (res.success) { showToast('Invoice updated', 'success'); await fetchInvoices(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update invoice', 'error')
      return false
    } finally { saving.value = false }
  }

  async function sendInvoice(id: string): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiSendInvoice(id)
      if (res.success) { showToast(`Sent as ${res.data?.invoice_number}`, 'success'); await fetchInvoices(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send invoice', 'error')
      return false
    } finally { saving.value = false }
  }

  async function voidInvoice(id: string, reason?: string): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiVoidInvoice(id, reason)
      if (res.success) { showToast('Invoice voided', 'success'); await fetchInvoices(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to void invoice', 'error')
      return false
    } finally { saving.value = false }
  }

  async function recordPayment(id: string, payload: { amount: number; method: string; reference?: string; note?: string }): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiRecordInvoicePayment(id, payload)
      if (res.success) { showToast('Payment recorded', 'success'); await fetchInvoices(); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to record payment', 'error')
      return false
    } finally { saving.value = false }
  }

  async function requestWriteOff(id: string, reason: string): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiRequestWriteOff(id, reason)
      if (res.success) { showToast('Write-off submitted for approval', 'success'); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to submit write-off', 'error')
      return false
    } finally { saving.value = false }
  }

  async function issueCreditNote(id: string, payload: { amount: number; reason?: string }): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiIssueCreditNote(id, payload)
      if (res.success) { showToast(`Credit note ${res.data?.credit_note_number} issued`, 'success'); return true }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to issue credit note', 'error')
      return false
    } finally { saving.value = false }
  }

  return {
    invoices, aging, loading, saving,
    fetchInvoices, fetchAging, fetchInvoice, createInvoice, updateInvoice,
    sendInvoice, voidInvoice, recordPayment, requestWriteOff, issueCreditNote,
  }
})
