<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Customers</h1>
          <p class="owner-subtitle">Customer records and credit limits — set a limit here before selling to someone on credit at the till.</p>
        </div>
        <button v-if="accessStore.can('customers.manage')" type="button" @click="openAddForm" class="owner-primary-action">
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Add customer</span>
          <span class="sm:hidden">Add</span>
        </button>
      </div>
    </section>

    <section class="owner-toolbar">
      <div class="owner-search-wrap">
        <MagnifyingGlassIcon class="owner-search-icon" />
        <input v-model="search" type="text" placeholder="Search by name or phone..." class="owner-search-input" @input="debouncedSearch" />
      </div>
    </section>

    <section class="mt-3">
      <div v-if="customersStore.loading" class="owner-panel space-y-2 p-3">
        <div v-for="i in 6" :key="i" class="skeleton h-10 rounded-lg" />
      </div>

      <div v-else-if="!customersStore.customers.length" class="owner-empty">
        <UserGroupIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No customers yet</p>
        <p class="mt-1 text-sm text-slate-500">Add a customer to set a credit limit before selling to them on credit.</p>
      </div>

      <div v-else class="owner-panel overflow-hidden !p-0">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th class="py-2.5 pl-4">Customer</th>
                <th class="py-2.5">Phone</th>
                <th class="py-2.5">Email</th>
                <th class="py-2.5 text-right">Credit limit</th>
                <th class="py-2.5 text-right">Owed</th>
                <th class="py-2.5 pr-4">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="customer in customersStore.customers"
                :key="customer.id"
                role="button"
                tabindex="0"
                class="cursor-pointer transition hover:bg-slate-50"
                @click="editCustomer(customer)"
                @keydown.enter="editCustomer(customer)"
              >
                <td class="py-2.5 pl-4">
                  <div class="flex items-center gap-2.5">
                    <span class="owner-brand-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary ring-1">
                      <UserIcon class="h-4 w-4" />
                    </span>
                    <span class="truncate font-bold text-slate-950">{{ customer.name || 'Unnamed customer' }}</span>
                  </div>
                </td>
                <td class="py-2.5 text-slate-700">{{ displayPhone(customer.phone) }}</td>
                <td class="py-2.5 text-slate-500">{{ customer.email || '—' }}</td>
                <td class="py-2.5 text-right font-semibold text-slate-900">
                  {{ customer.credit_limit > 0 ? `KES ${customer.credit_limit.toLocaleString()}` : '—' }}
                </td>
                <td class="py-2.5 text-right font-semibold text-slate-900">
                  {{ customer.credit_limit > 0 ? `KES ${customer.credit_balance.toLocaleString()}` : '—' }}
                </td>
                <td class="py-2.5 pr-4">
                  <span
                    v-if="customer.credit_limit > 0"
                    :class="['rounded-full px-2 py-1 text-xs font-bold', customer.credit_balance >= customer.credit_limit ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700']"
                  >
                    {{ customer.credit_balance >= customer.credit_limit ? 'At limit' : 'Credit ok' }}
                  </span>
                  <span v-else class="text-xs font-medium text-slate-400">No credit limit</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" @click.self="cancelForm">
          <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" class="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 id="customer-dialog-title" class="text-base font-black text-slate-950">{{ editingId ? 'Edit customer' : 'New customer' }}</h2>
                <p class="mt-0.5 text-xs text-slate-500">A credit limit of 0 means this customer cannot be sold to on credit.</p>
              </div>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close customer dialog" @click="cancelForm">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <form class="max-h-[70vh] space-y-3 overflow-y-auto p-4" @submit.prevent="saveCustomer">
              <label class="block">
                <span class="admin-label">Name</span>
                <input v-model="form.name" type="text" maxlength="120" required placeholder="e.g. Jane Wanjiru" class="owner-input mt-1.5" />
              </label>
              <label class="block">
                <span class="admin-label">Phone</span>
                <QePhoneInput v-model="form.phone" class="mt-1.5" placeholder="0712 345 678" />
              </label>
              <label class="block">
                <span class="admin-label">Email (optional)</span>
                <input v-model="form.email" type="email" maxlength="200" placeholder="jane@example.com" class="owner-input mt-1.5" />
              </label>
              <label class="block">
                <span class="admin-label">Credit limit (KES)</span>
                <input v-model.number="form.credit_limit" type="number" min="0" step="1" placeholder="0" class="owner-input mt-1.5" />
              </label>

              <div v-if="editingId && detail?.credit_balance" class="owner-panel !p-3">
                <p class="text-xs font-semibold text-slate-500">Currently owed</p>
                <p class="text-lg font-black text-slate-950">KES {{ detail.credit_balance.toLocaleString() }}</p>
                <p v-if="detail.open_invoices.length" class="mt-1 text-[11px] text-slate-500">
                  {{ detail.open_invoices.length }} unpaid invoice{{ detail.open_invoices.length === 1 ? '' : 's' }} —
                  <RouterLink :to="{ path: '/billing', query: { tab: 'ar' } }" class="font-semibold text-primary" @click="cancelForm">settle in Billing</RouterLink>
                </p>
              </div>

              <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" class="owner-secondary-action" @click="cancelForm">Cancel</button>
                <button type="submit" :disabled="!form.name || customersStore.saving" class="owner-primary-action">
                  <svg v-if="customersStore.saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {{ customersStore.saving ? 'Saving…' : editingId ? 'Save changes' : 'Add customer' }}
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
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { PlusIcon, MagnifyingGlassIcon, UserIcon, UserGroupIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { QePhoneInput } from '@qesuite/ui'
import { displayPhone } from '@qesuite/shared'
import { useCustomersStore } from '@/stores/customers'
import { useAccessStore } from '@/stores/access'
import type { Customer, CustomerDetail } from '@qesuite/types'

const customersStore = useCustomersStore()
const accessStore = useAccessStore()

const search = ref('')
const showForm = ref(false)
const editingId = ref<string | null>(null)
const detail = ref<CustomerDetail | null>(null)
const form = reactive({ name: '', phone: '', email: '', credit_limit: 0 })

let searchTimeout: ReturnType<typeof setTimeout> | undefined
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => customersStore.fetchCustomers({ search: search.value.trim() || undefined }), 300)
}

function resetForm() {
  form.name = ''; form.phone = ''; form.email = ''; form.credit_limit = 0
  detail.value = null
}

function openAddForm() {
  editingId.value = null
  resetForm()
  showForm.value = true
}

async function editCustomer(customer: Customer) {
  editingId.value = customer.id
  form.name = customer.name || ''
  form.phone = customer.phone
  form.email = customer.email || ''
  form.credit_limit = customer.credit_limit
  showForm.value = true
  detail.value = await customersStore.fetchCustomer(customer.id)
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  resetForm()
}

async function saveCustomer() {
  if (!form.name) return
  const payload = { name: form.name, phone: form.phone, email: form.email || undefined, credit_limit: form.credit_limit || 0 }
  const ok = editingId.value
    ? await customersStore.updateCustomer(editingId.value, payload)
    : await customersStore.createCustomer(payload)
  if (ok) cancelForm()
}

onMounted(() => customersStore.fetchCustomers())
</script>
