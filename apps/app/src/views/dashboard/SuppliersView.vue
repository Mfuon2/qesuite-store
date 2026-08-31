<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Suppliers</h1>
          <p class="owner-subtitle">Who you buy stock from — used on purchase orders and product records.</p>
        </div>
        <button v-if="accessStore.can('suppliers.manage')" type="button" @click="openAddForm" class="owner-primary-action">
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Add supplier</span>
          <span class="sm:hidden">Add</span>
        </button>
      </div>
    </section>

    <section class="owner-toolbar">
      <div class="owner-search-wrap">
        <MagnifyingGlassIcon class="owner-search-icon" />
        <input v-model="search" type="text" placeholder="Search suppliers..." class="owner-search-input" />
      </div>
      <label class="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
        <input v-model="showInactive" type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary" @change="suppliersStore.fetchSuppliers(showInactive)" />
        Show deactivated
      </label>
    </section>

    <section class="mt-3">
      <div v-if="suppliersStore.loading" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-2xl" />
      </div>

      <div v-else-if="!filteredSuppliers.length" class="owner-empty">
        <TruckIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No suppliers yet</p>
        <p class="mt-1 text-sm text-slate-500">Add a supplier so you can raise purchase orders against them.</p>
      </div>

      <div v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="supplier in filteredSuppliers"
          :key="supplier.id"
          type="button"
          class="owner-panel min-w-0 cursor-pointer p-3 text-left transition hover:shadow-md"
          @click="editSupplier(supplier)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="owner-brand-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary ring-1">
              <TruckIcon class="h-4 w-4" />
            </div>
            <span :class="['rounded-full px-2 py-0.5 text-[10px] font-bold', supplier.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500']">
              {{ supplier.is_active ? 'Active' : 'Deactivated' }}
            </span>
          </div>
          <p class="mt-2 truncate text-sm font-bold text-slate-950">{{ supplier.name }}</p>
          <p class="truncate text-xs font-medium text-slate-500">{{ supplier.phone ? displayPhone(supplier.phone) : supplier.email || 'No contact on file' }}</p>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" @click.self="cancelForm">
          <section role="dialog" aria-modal="true" aria-labelledby="supplier-dialog-title" class="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 id="supplier-dialog-title" class="text-base font-black text-slate-950">{{ editingId ? 'Edit supplier' : 'New supplier' }}</h2>
                <p class="mt-0.5 text-xs text-slate-500">Contact details help you reach them when a delivery is late.</p>
              </div>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close supplier dialog" @click="cancelForm">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <form class="max-h-[70vh] space-y-3 overflow-y-auto p-4" @submit.prevent="saveSupplier">
              <label class="block">
                <span class="admin-label">Supplier name</span>
                <input v-model="form.name" type="text" maxlength="120" required placeholder="e.g. Naivas Wholesale" class="owner-input mt-1.5" />
              </label>
              <label class="block">
                <span class="admin-label">Phone</span>
                <QePhoneInput v-model="form.phone" class="mt-1.5" placeholder="0712 345 678" />
              </label>
              <label class="block">
                <span class="admin-label">Email</span>
                <input v-model="form.email" type="email" maxlength="200" placeholder="orders@supplier.co.ke" class="owner-input mt-1.5" />
              </label>
              <label class="block">
                <span class="admin-label">Address</span>
                <input v-model="form.address" type="text" maxlength="200" placeholder="Industrial Area, Nairobi" class="owner-input mt-1.5" />
              </label>
              <label class="block">
                <span class="admin-label">Notes</span>
                <textarea v-model="form.notes" rows="2" maxlength="500" placeholder="Payment terms, delivery days, etc." class="owner-input mt-1.5 resize-none" />
              </label>

              <label v-if="editingId" class="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input v-model="form.is_active" type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary" />
                Active
              </label>

              <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" class="owner-secondary-action" @click="cancelForm">Cancel</button>
                <button type="submit" :disabled="!form.name || suppliersStore.saving" class="owner-primary-action">
                  <svg v-if="suppliersStore.saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {{ suppliersStore.saving ? 'Saving…' : editingId ? 'Save changes' : 'Add supplier' }}
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
import { ref, reactive, computed, onMounted } from 'vue'
import { PlusIcon, MagnifyingGlassIcon, TruckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { QePhoneInput } from '@qesuite/ui'
import { displayPhone } from '@qesuite/shared'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAccessStore } from '@/stores/access'
import type { Supplier } from '@qesuite/types'

const suppliersStore = useSuppliersStore()
const accessStore = useAccessStore()

const search = ref('')
const showInactive = ref(false)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', phone: '', email: '', address: '', notes: '', is_active: true })

const filteredSuppliers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return suppliersStore.suppliers
  return suppliersStore.suppliers.filter(s => s.name.toLowerCase().includes(q))
})

function resetForm() {
  form.name = ''; form.phone = ''; form.email = ''; form.address = ''; form.notes = ''; form.is_active = true
}

function openAddForm() {
  editingId.value = null
  resetForm()
  showForm.value = true
}

function editSupplier(supplier: Supplier) {
  editingId.value = supplier.id
  form.name = supplier.name
  form.phone = supplier.phone || ''
  form.email = supplier.email || ''
  form.address = supplier.address || ''
  form.notes = supplier.notes || ''
  form.is_active = supplier.is_active
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  resetForm()
}

async function saveSupplier() {
  if (!form.name) return
  const payload = {
    name: form.name,
    phone: form.phone || undefined,
    email: form.email || undefined,
    address: form.address || undefined,
    notes: form.notes || undefined,
  }
  const ok = editingId.value
    ? await suppliersStore.updateSupplier(editingId.value, { ...payload, is_active: form.is_active })
    : await suppliersStore.createSupplier(payload)
  if (ok) cancelForm()
}

onMounted(() => suppliersStore.fetchSuppliers())
</script>
