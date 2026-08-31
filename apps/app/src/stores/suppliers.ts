import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetSuppliers, apiCreateSupplier, apiUpdateSupplier, apiDeactivateSupplier, type SupplierInput } from '@/api/suppliers'
import type { Supplier } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  async function fetchSuppliers(includeInactive = false) {
    loading.value = true
    try {
      const res = await apiGetSuppliers(includeInactive)
      if (res.success && res.data) suppliers.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load suppliers', 'error')
    } finally {
      loading.value = false
    }
  }

  async function createSupplier(payload: SupplierInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiCreateSupplier(payload)
      if (res.success) {
        showToast('Supplier added', 'success')
        await fetchSuppliers()
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add supplier', 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateSupplier(id: string, payload: Partial<SupplierInput> & { is_active?: boolean }): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiUpdateSupplier(id, payload)
      if (res.success) {
        showToast('Supplier updated', 'success')
        await fetchSuppliers()
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update supplier', 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  async function deactivateSupplier(id: string): Promise<boolean> {
    try {
      await apiDeactivateSupplier(id)
      showToast('Supplier deactivated', 'success')
      await fetchSuppliers()
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to deactivate supplier', 'error')
      return false
    }
  }

  return { suppliers, loading, saving, fetchSuppliers, createSupplier, updateSupplier, deactivateSupplier }
})
