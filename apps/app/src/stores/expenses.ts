import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetExpenses, apiCreateExpense, apiDeleteExpense, apiGetExpenseSummary,
  type ExpenseSummary
} from '@/api/expenses'
import type { Expense, ExpenseCreate } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useExpensesStore = defineStore('expenses', () => {
  const expenses = ref<Expense[]>([])
  const summary = ref<ExpenseSummary | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const total = ref(0)
  const { showToast } = useToast()

  async function fetchExpenses(params?: { category?: string; from?: string; to?: string; page?: number }) {
    loading.value = true
    try {
      const res = await apiGetExpenses(params)
      expenses.value = res.items
      total.value = res.total
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load expenses', 'error')
    } finally {
      loading.value = false
    }
  }

  async function createExpense(payload: ExpenseCreate): Promise<boolean> {
    saving.value = true
    try {
      const res = await apiCreateExpense(payload)
      if (res.data) {
        await fetchExpenses()
        showToast('Expense recorded', 'success')
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to record expense', 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteExpense(id: string): Promise<boolean> {
    try {
      await apiDeleteExpense(id)
      expenses.value = expenses.value.filter(e => e.id !== id)
      showToast('Expense deleted', 'success')
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete expense', 'error')
      return false
    }
  }

  async function fetchSummary(params?: { period?: string; from?: string; to?: string }) {
    try {
      const res = await apiGetExpenseSummary(params)
      if (res.data) summary.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load expense summary', 'error')
    }
  }

  return {
    expenses,
    summary,
    loading,
    saving,
    total,
    fetchExpenses,
    createExpense,
    deleteExpense,
    fetchSummary,
  }
})
