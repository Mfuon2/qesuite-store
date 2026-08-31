import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetCustomers, apiGetCustomer, apiCreateCustomer, apiUpdateCustomer, type CustomerInput } from '@/api/customers'
import type { Customer, CustomerDetail } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  async function fetchCustomers(params: { page?: number; limit?: number; search?: string } = {}) {
    loading.value = true
    try {
      const res = await apiGetCustomers(params)
      if (res.success && res.data) {
        customers.value = res.data
        total.value = res.meta?.total ?? res.data.length
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load customers', 'error')
    } finally { loading.value = false }
  }

  async function fetchCustomer(id: string): Promise<CustomerDetail | null> {
    try {
      const res = await apiGetCustomer(id)
      return res.success && res.data ? res.data : null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load customer', 'error')
      return null
    }
  }

  async function createCustomer(payload: CustomerInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiCreateCustomer(payload)
      if (res.success) { showToast('Customer added', 'success'); await fetchCustomers(); return true }
      showToast(res.error ?? 'Failed to add customer', 'error')
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add customer', 'error')
      return false
    } finally { saving.value = false }
  }

  async function updateCustomer(id: string, payload: CustomerInput): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiUpdateCustomer(id, payload)
      if (res.success) { showToast('Customer updated', 'success'); await fetchCustomers(); return true }
      showToast(res.error ?? 'Failed to update customer', 'error')
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update customer', 'error')
      return false
    } finally { saving.value = false }
  }

  return { customers, total, loading, saving, fetchCustomers, fetchCustomer, createCustomer, updateCustomer }
})
