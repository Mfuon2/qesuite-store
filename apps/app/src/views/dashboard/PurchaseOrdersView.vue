<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Purchase Orders</h1>
          <p class="owner-subtitle">Order stock from suppliers, get it approved, and receive it into inventory.</p>
        </div>
        <button v-if="accessStore.can('purchase_orders.create')" type="button" @click="openCreateForm" class="owner-primary-action">
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">New purchase order</span>
          <span class="sm:hidden">New PO</span>
        </button>
      </div>
    </section>

    <section class="owner-toolbar">
      <div class="owner-segmented" aria-label="Filter by status">
        <button
          v-for="opt in statusFilters"
          :key="opt.value"
          @click="statusFilter = opt.value; poStore.fetchOrders(opt.value || undefined)"
          :class="['owner-segment-button', statusFilter === opt.value ? 'owner-segment-button-active' : '']"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <section class="mt-3">
      <div v-if="poStore.loading" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-2xl" />
      </div>

      <div v-else-if="!poStore.orders.length" class="owner-empty">
        <ClipboardDocumentListIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No purchase orders yet</p>
        <p class="mt-1 text-sm text-slate-500">Draft one to order stock from a supplier.</p>
      </div>

      <div v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="po in poStore.orders"
          :key="po.id"
          type="button"
          class="owner-panel min-w-0 cursor-pointer p-3 text-left transition hover:shadow-md"
          @click="openDetail(po.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="truncate text-sm font-black text-slate-950">{{ po.po_number }}</p>
            <span :class="['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', statusClass(po.status)]">{{ statusLabel(po.status) }}</span>
          </div>
          <p class="mt-1 truncate text-xs font-medium text-slate-500">{{ po.supplier_name }}</p>
          <p class="mt-2 text-sm font-bold text-slate-800">KES {{ po.subtotal.toLocaleString() }}</p>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" @click.self="closeModal">
          <section role="dialog" aria-modal="true" class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div class="min-w-0">
                <h2 class="text-base font-black text-slate-950">{{ mode === 'create' ? 'New purchase order' : detail?.po_number }}</h2>
                <p v-if="detail" class="mt-0.5 text-xs font-semibold capitalize text-slate-500">{{ statusLabel(detail.status) }} &middot; {{ detail.supplier_name }}</p>
                <p v-else class="mt-0.5 text-xs text-slate-500">Pick a supplier and the items you're ordering.</p>
              </div>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close" @click="closeModal">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <!-- Create / edit draft form -->
              <form v-if="mode === 'create' || mode === 'edit'" class="space-y-3" @submit.prevent="saveDraft">
                <label class="block">
                  <span class="admin-label">Supplier</span>
                  <QeSelect v-model="form.supplier_id" class="mt-1.5" placeholder="Choose supplier" :options="supplierOptions" />
                </label>

                <div>
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="admin-label">Line items</span>
                    <button type="button" class="text-xs font-bold text-primary" @click="addLine">+ Add item</button>
                  </div>
                  <div class="space-y-2">
                    <div v-for="(line, idx) in form.items" :key="idx" class="grid min-w-0 grid-cols-[minmax(0,1fr)_64px_80px_28px] items-center gap-1.5">
                      <QeSelect v-model="line.product_id" :options="productOptions" placeholder="Product" size="sm" />
                      <input v-model.number="line.quantity_ordered" type="number" min="1" placeholder="Qty" class="owner-input !min-h-8 !rounded-lg !py-1 text-center !text-xs" />
                      <input v-model.number="line.unit_cost" type="number" min="0" placeholder="Cost" class="owner-input !min-h-8 !rounded-lg !py-1 text-center !text-xs" />
                      <button type="button" class="owner-action-icon" @click="removeLine(idx)"><TrashIcon class="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>

                <label class="block">
                  <span class="admin-label">Notes</span>
                  <textarea v-model="form.notes" rows="2" maxlength="500" class="owner-input mt-1.5 resize-none" placeholder="Delivery instructions, references, etc." />
                </label>

                <p class="text-right text-sm font-black text-slate-950">Subtotal: KES {{ formSubtotal.toLocaleString() }}</p>

                <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" class="owner-secondary-action" @click="closeModal">Cancel</button>
                  <button type="submit" :disabled="!canSaveDraft || poStore.saving" class="owner-primary-action">
                    {{ poStore.saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save draft' }}
                  </button>
                </div>
              </form>

              <!-- View / receive -->
              <div v-else-if="detail" class="space-y-3">
                <div class="overflow-x-auto rounded-xl border border-slate-100">
                  <table class="w-full text-xs">
                    <thead class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th class="px-2.5 py-2 text-left">Product</th>
                        <th class="px-2.5 py-2 text-right">Ordered</th>
                        <th class="px-2.5 py-2 text-right">Received</th>
                        <th class="px-2.5 py-2 text-right">Cost</th>
                        <th v-if="mode === 'receive'" class="px-2.5 py-2 text-right">Receive now</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-for="item in detail.items" :key="item.id">
                        <td class="px-2.5 py-2 font-semibold text-slate-800">{{ item.product_name }}</td>
                        <td class="px-2.5 py-2 text-right">{{ item.quantity_ordered }} {{ item.unit_of_measure }}</td>
                        <td class="px-2.5 py-2 text-right">{{ item.quantity_received }}</td>
                        <td class="px-2.5 py-2 text-right">{{ item.unit_cost.toLocaleString() }}</td>
                        <td v-if="mode === 'receive'" class="px-2.5 py-2 text-right">
                          <input
                            type="number" min="0" :max="item.quantity_ordered - item.quantity_received"
                            v-model.number="receiveQuantities[item.id]"
                            class="owner-input !min-h-7 w-16 !rounded-lg !py-0.5 text-center !text-xs"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="text-right text-sm font-black text-slate-950">Subtotal: KES {{ detail.subtotal.toLocaleString() }}</p>
                <p v-if="detail.notes" class="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">{{ detail.notes }}</p>

                <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <button v-if="detail.status === 'draft' && accessStore.can('purchase_orders.create')" type="button" class="owner-secondary-action" @click="startEdit">Edit</button>
                  <button v-if="['draft','pending_approval','approved','sent'].includes(detail.status) && accessStore.can('purchase_orders.create')" type="button" class="owner-secondary-action hover:!bg-red-50 hover:!text-red-600" @click="doAction(() => poStore.cancelOrder(detail!.id))">Cancel</button>
                  <button v-if="detail.status === 'draft' && accessStore.can('purchase_orders.create')" type="button" class="owner-primary-action" @click="doAction(() => poStore.submitOrder(detail!.id))">Submit for approval</button>
                  <button v-if="detail.status === 'pending_approval' && accessStore.can('purchase_orders.approve')" type="button" class="owner-secondary-action hover:!bg-red-50 hover:!text-red-600" @click="doAction(() => poStore.rejectOrder(detail!.id))">Reject</button>
                  <button v-if="detail.status === 'pending_approval' && accessStore.can('purchase_orders.approve')" type="button" class="owner-primary-action" @click="doAction(() => poStore.approveOrder(detail!.id))">Approve</button>
                  <button v-if="detail.status === 'approved' && accessStore.can('purchase_orders.approve')" type="button" class="owner-primary-action" @click="doAction(() => poStore.sendOrder(detail!.id))">Mark sent to supplier</button>
                  <button v-if="['sent','partially_received'].includes(detail.status) && accessStore.can('purchase_orders.receive') && mode !== 'receive'" type="button" class="owner-primary-action" @click="startReceive">Receive stock</button>
                  <button v-if="mode === 'receive'" type="button" class="owner-primary-action" :disabled="!canSubmitReceive || poStore.saving" @click="submitReceive">
                    {{ poStore.saving ? 'Saving…' : 'Confirm receipt' }}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { PlusIcon, XMarkIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import { QeSelect } from '@qesuite/ui'
import { usePurchaseOrdersStore } from '@/stores/purchaseOrders'
import { useSuppliersStore } from '@/stores/suppliers'
import { useProductsStore } from '@/stores/products'
import { useAccessStore } from '@/stores/access'
import type { PurchaseOrder, PurchaseOrderStatus } from '@qesuite/types'

const poStore = usePurchaseOrdersStore()
const suppliersStore = useSuppliersStore()
const productsStore = useProductsStore()
const accessStore = useAccessStore()

const statusFilter = ref('')
const statusFilters = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_received', label: 'Partial' },
  { value: 'received', label: 'Received' },
]

const STATUS_META: Record<PurchaseOrderStatus, { label: string; class: string }> = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600' },
  pending_approval: { label: 'Pending approval', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-sky-100 text-sky-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
  sent: { label: 'Sent to supplier', class: 'bg-violet-100 text-violet-700' },
  partially_received: { label: 'Partially received', class: 'bg-orange-100 text-orange-700' },
  received: { label: 'Received', class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', class: 'bg-slate-100 text-slate-400' },
}
const statusLabel = (s: PurchaseOrderStatus) => STATUS_META[s]?.label ?? s
const statusClass = (s: PurchaseOrderStatus) => STATUS_META[s]?.class ?? 'bg-slate-100 text-slate-500'

const showModal = ref(false)
const mode = ref<'create' | 'edit' | 'view' | 'receive'>('create')
const detail = ref<PurchaseOrder | null>(null)
const editingId = ref<string | null>(null)
const receiveQuantities = reactive<Record<string, number>>({})

const form = reactive<{ supplier_id: string; notes: string; items: { product_id: string; quantity_ordered: number; unit_cost: number }[] }>({
  supplier_id: '', notes: '', items: [],
})

const supplierOptions = computed(() => suppliersStore.suppliers.filter(s => s.is_active).map(s => ({ value: s.id, label: s.name })))
const productOptions = computed(() => productsStore.products.map(p => ({ value: p.id, label: p.name })))

const formSubtotal = computed(() => form.items.reduce((sum, i) => sum + (i.quantity_ordered || 0) * (i.unit_cost || 0), 0))
const canSaveDraft = computed(() =>
  !!form.supplier_id && form.items.length > 0 &&
  form.items.every(i => i.product_id && i.quantity_ordered > 0 && i.unit_cost >= 0)
)
const canSubmitReceive = computed(() => Object.values(receiveQuantities).some(qty => qty > 0))

function addLine() { form.items.push({ product_id: '', quantity_ordered: 1, unit_cost: 0 }) }
function removeLine(idx: number) { form.items.splice(idx, 1) }

function openCreateForm() {
  mode.value = 'create'
  editingId.value = null
  detail.value = null
  form.supplier_id = ''; form.notes = ''; form.items = [{ product_id: '', quantity_ordered: 1, unit_cost: 0 }]
  showModal.value = true
}

async function openDetail(id: string) {
  const order = await poStore.fetchOrder(id)
  if (!order) return
  detail.value = order
  mode.value = 'view'
  showModal.value = true
}

function startEdit() {
  if (!detail.value) return
  editingId.value = detail.value.id
  form.supplier_id = detail.value.supplier_id
  form.notes = detail.value.notes || ''
  form.items = (detail.value.items || []).map(i => ({ product_id: i.product_id, quantity_ordered: i.quantity_ordered, unit_cost: i.unit_cost }))
  mode.value = 'edit'
}

function startReceive() {
  if (!detail.value) return
  for (const item of detail.value.items || []) receiveQuantities[item.id] = 0
  mode.value = 'receive'
}

function closeModal() {
  showModal.value = false
  detail.value = null
  editingId.value = null
}

async function saveDraft() {
  if (!canSaveDraft.value) return
  const payload = { supplier_id: form.supplier_id, notes: form.notes || undefined, items: form.items }
  const ok = editingId.value ? await poStore.updateOrder(editingId.value, payload) : await poStore.createOrder(payload)
  if (ok) closeModal()
}

async function doAction(action: () => Promise<boolean>) {
  const ok = await action()
  if (ok) closeModal()
}

async function submitReceive() {
  if (!detail.value) return
  const items = Object.entries(receiveQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([item_id, quantity_received_now]) => ({ item_id, quantity_received_now }))
  if (!items.length) return
  const ok = await poStore.receiveOrder(detail.value.id, { items })
  if (ok) closeModal()
}

onMounted(() => {
  poStore.fetchOrders()
  if (!suppliersStore.suppliers.length) suppliersStore.fetchSuppliers()
  if (!productsStore.products.length) productsStore.fetchProducts()
})
</script>
