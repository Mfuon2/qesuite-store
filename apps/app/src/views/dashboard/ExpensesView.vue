<template>
  <div class="owner-page">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Expenses</h1>
          <p class="owner-subtitle">Record day-to-day business costs so your reports can estimate profit or loss.</p>
        </div>
        <button v-if="accessStore.can('expenses.create')" type="button" class="owner-primary-action" @click="openExpenseDialog">
          <PlusIcon class="h-4 w-4" />
          Add expense
        </button>
      </div>
    </section>

    <section class="owner-stat-grid">
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-orange-50 text-orange-700 ring-orange-100">
          <ReceiptRefundIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">KES {{ (expensesStore.summary?.total ?? 0).toLocaleString() }}</p>
          <p class="text-xs font-medium text-slate-500">Total this month</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <DocumentTextIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ expensesStore.total }}</p>
          <p class="text-xs font-medium text-slate-500">Entries logged</p>
        </div>
      </div>
    </section>

    <section class="mt-3">
      <div v-if="expensesStore.loading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="skeleton h-16 rounded-2xl" />
      </div>

      <div v-else-if="!expensesStore.expenses.length" class="owner-empty">
        <ReceiptRefundIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No expenses logged</p>
        <p class="mt-1 text-sm text-slate-500">Track supplier restocks, rent, wages, and other costs here.</p>
      </div>

      <div v-else class="owner-panel p-2">
        <div class="space-y-2">
          <div v-for="expense in expensesStore.expenses" :key="expense.id" class="owner-list-row flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-950">{{ categoryLabel(expense.category) }}</p>
              <p class="truncate text-xs font-medium text-slate-500">{{ expense.description || '—' }}</p>
            </div>
            <p class="shrink-0 text-xs font-medium text-slate-400">{{ expense.expense_date }}</p>
            <p class="w-24 shrink-0 text-right text-sm font-black text-slate-950">KES {{ expense.amount.toLocaleString() }}</p>
            <button v-if="accessStore.can('expenses.delete')" @click="confirmDelete(expense.id)" class="owner-action-icon hover:bg-red-50 hover:text-red-500">
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showExpenseDialog"
          class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
          @click.self="closeExpenseDialog"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-dialog-title"
            class="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
          >
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 id="expense-dialog-title" class="text-base font-black text-slate-950">Log an expense</h2>
                <p class="mt-0.5 text-xs text-slate-500">Add a business cost to this month's reports.</p>
              </div>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close expense dialog" @click="closeExpenseDialog">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <form class="space-y-3 p-4" @submit.prevent="handleSubmit">
              <label class="block">
                <span class="admin-label">Category</span>
                <select v-model="form.category" class="owner-select mt-1.5">
                  <option v-for="(meta, key) in EXPENSE_CATEGORIES" :key="key" :value="key">{{ meta.label }}</option>
                </select>
              </label>

              <label class="block">
                <span class="admin-label">Description</span>
                <input v-model="form.description" type="text" maxlength="240" placeholder="Description (optional)" class="owner-input mt-1.5" />
              </label>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block">
                  <span class="admin-label">Amount (KES)</span>
                  <input v-model.number="form.amount" type="number" min="1" step="0.01" inputmode="decimal" placeholder="0.00" class="owner-input mt-1.5" />
                </label>
                <label class="block">
                  <span class="admin-label">Expense date</span>
                  <input v-model="form.expense_date" type="date" class="owner-input mt-1.5" />
                </label>
              </div>

              <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" class="owner-secondary-action" @click="closeExpenseDialog">Cancel</button>
                <button type="submit" :disabled="!canSubmit || expensesStore.saving" class="owner-primary-action">
                  <PlusIcon class="h-4 w-4" />
                  {{ expensesStore.saving ? 'Adding…' : 'Add expense' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, TrashIcon, ReceiptRefundIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { EXPENSE_CATEGORIES, todayNairobi } from '@qesuite/shared'
import { useExpensesStore } from '@/stores/expenses'
import { useSettingsStore } from '@/stores/settings'
import { useAccessStore } from '@/stores/access'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'
import type { ExpenseCategory } from '@qesuite/types'

const router = useRouter()
const expensesStore = useExpensesStore()
const settingsStore = useSettingsStore()
const accessStore = useAccessStore()
const { confirm } = useConfirm()
const { showToast } = useToast()
const showExpenseDialog = ref(false)

const form = ref<{ category: ExpenseCategory; description: string; amount: number | null; expense_date: string }>({
  category: 'supplies',
  description: '',
  amount: null,
  expense_date: todayNairobi(),
})

const canSubmit = computed(() => !!form.value.amount && form.value.amount > 0 && !!form.value.expense_date)

function resetForm() {
  form.value = { category: 'supplies', description: '', amount: null, expense_date: todayNairobi() }
}

function openExpenseDialog() {
  resetForm()
  showExpenseDialog.value = true
}

function closeExpenseDialog() {
  if (expensesStore.saving) return
  showExpenseDialog.value = false
  resetForm()
}

function categoryLabel(category: string): string {
  return EXPENSE_CATEGORIES[category as ExpenseCategory]?.label ?? category
}

async function handleSubmit() {
  if (!canSubmit.value || !form.value.amount) return
  const ok = await expensesStore.createExpense({
    category: form.value.category,
    description: form.value.description || undefined,
    amount: form.value.amount,
    expense_date: form.value.expense_date,
  })
  if (ok) {
    showExpenseDialog.value = false
    resetForm()
    await expensesStore.fetchSummary({ period: 'month' })
  }
}

async function confirmDelete(id: string) {
  const ok = await confirm({
    title: 'Delete expense',
    message: 'Are you sure you want to delete this expense entry? This cannot be undone.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (ok) {
    await expensesStore.deleteExpense(id)
    await expensesStore.fetchSummary({ period: 'month' })
  }
}

onMounted(async () => {
  if (!settingsStore.tenant) await settingsStore.fetchTenant()
  if (settingsStore.tenant?.store_category !== 'food') {
    showToast('Expenses are only available for restaurant stores', 'error')
    router.replace('/dashboard')
    return
  }
  await Promise.all([
    expensesStore.fetchExpenses(),
    expensesStore.fetchSummary({ period: 'month' }),
  ])
})
</script>
