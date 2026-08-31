<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Billing</h1>
          <p class="owner-subtitle">Quote, invoice, and collect payment from your own customers.</p>
        </div>
        <button v-if="activeTab === 'invoices' && accessStore.can('billing.create')" type="button" @click="openCreateForm" class="owner-primary-action">
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">New invoice</span>
          <span class="sm:hidden">New</span>
        </button>
      </div>
    </section>

    <section class="owner-toolbar">
      <div class="owner-segmented" aria-label="Section">
        <button
          v-for="opt in tabOptions"
          :key="opt.value"
          @click="activeTab = opt.value"
          :class="['owner-segment-button', activeTab === opt.value ? 'owner-segment-button-active' : '']"
        >
          {{ opt.label }}
        </button>
      </div>
      <div v-if="activeTab === 'invoices'" class="owner-segmented" aria-label="Filter by status">
        <button
          v-for="opt in statusFilters"
          :key="opt.value"
          @click="customerFilter = null; statusFilter = opt.value; invoicesStore.fetchInvoices({ status: opt.value || undefined })"
          :class="['owner-segment-button', statusFilter === opt.value ? 'owner-segment-button-active' : '']"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <div v-if="activeTab === 'invoices' && customerFilter" class="mt-2 flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        {{ customerFilter.name }}
        <button type="button" aria-label="Clear customer filter" @click="clearCustomerFilter">
          <XMarkIcon class="h-3.5 w-3.5" />
        </button>
      </span>
    </div>

    <!-- Invoices -->
    <section v-if="activeTab === 'invoices'" class="mt-3">
      <div v-if="invoicesStore.loading" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="skeleton h-24 rounded-2xl" />
      </div>
      <div v-else-if="!invoicesStore.invoices.length" class="owner-empty">
        <DocumentTextIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No invoices yet</p>
        <p class="mt-1 text-sm text-slate-500">Create a quotation or invoice to bill a customer.</p>
      </div>
      <div v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="inv in invoicesStore.invoices"
          :key="inv.id"
          type="button"
          class="owner-panel min-w-0 cursor-pointer p-3 text-left transition hover:shadow-md"
          @click="openDetail(inv.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="truncate text-sm font-black text-slate-950">{{ inv.invoice_number || TYPE_META[inv.type].draftLabel }}</p>
            <span :class="['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', STATUS_CLASS[inv.status]]">{{ inv.status.replace('_', ' ') }}</span>
          </div>
          <p class="mt-1 truncate text-xs font-medium text-slate-500">{{ inv.customer_name }} &middot; {{ TYPE_META[inv.type].label }}</p>
          <div class="mt-2 flex items-baseline justify-between">
            <p class="text-sm font-bold text-slate-800">KES {{ inv.total.toLocaleString() }}</p>
            <p v-if="inv.amount_paid > 0 && inv.amount_paid < inv.total" class="text-[11px] font-semibold text-emerald-600">{{ inv.amount_paid.toLocaleString() }} paid</p>
          </div>
        </button>
      </div>
    </section>

    <!-- Accounts receivable -->
    <section v-else class="mt-3">
      <div v-if="!invoicesStore.aging.length" class="owner-empty">
        <BanknotesIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No outstanding balances</p>
        <p class="mt-1 text-sm text-slate-500">Customers who owe you on sent invoices will show up here.</p>
      </div>
      <div v-else class="owner-panel space-y-1.5 !p-1.5">
        <button
          v-for="row in invoicesStore.aging"
          :key="row.customer_id"
          type="button"
          class="owner-list-row flex w-full items-center gap-3 text-left transition hover:bg-slate-50"
          @click="viewCustomerInvoices(row)"
        >
          <div class="owner-brand-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary ring-1">
            <UserIcon class="h-4 w-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-950">{{ row.name }}</p>
            <p class="truncate text-xs font-medium text-slate-400">{{ displayPhone(row.phone) }} &middot; due {{ row.oldest_due_date ? formatDate(row.oldest_due_date) : '—' }}</p>
          </div>
          <span :class="['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', AGING_CLASS[row.bucket]]">{{ row.bucket }}d</span>
          <p class="w-24 shrink-0 text-right text-sm font-black text-slate-950">KES {{ row.credit_balance.toLocaleString() }}</p>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" @click.self="closeModal">
          <section role="dialog" aria-modal="true" class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div class="min-w-0">
                <h2 class="text-base font-black text-slate-950">{{ mode === 'create' ? 'New invoice' : detail?.invoice_number || 'Draft' }}</h2>
                <p v-if="detail" class="mt-0.5 text-xs font-semibold capitalize text-slate-500">{{ detail.status.replace('_',' ') }} &middot; {{ detail.customer_name }}</p>
                <p v-else class="mt-0.5 text-xs text-slate-500">Quotations and pro-formas don't affect accounts receivable — only invoices and recurring bills do.</p>
              </div>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close" @click="closeModal">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <!-- Create / edit draft -->
              <form v-if="mode === 'create' || mode === 'edit'" class="space-y-3" @submit.prevent="saveDraft">
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="block">
                    <span class="admin-label">Document type</span>
                    <QeSelect v-model="form.type" class="mt-1.5" :options="typeOptions" :disabled="mode === 'edit'" />
                  </label>
                  <label class="block">
                    <span class="admin-label">Payment terms (days)</span>
                    <input v-model.number="form.payment_terms_days" type="number" min="0" placeholder="0 = due on receipt" class="owner-input mt-1.5" />
                  </label>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="block">
                    <span class="admin-label">Customer name</span>
                    <input v-model="form.customer_name" type="text" maxlength="120" required placeholder="e.g. Jane Wanjiru" class="owner-input mt-1.5" />
                  </label>
                  <label class="block">
                    <span class="admin-label">Customer phone</span>
                    <QePhoneInput v-model="form.customer_phone" class="mt-1.5" placeholder="0712 345 678" />
                  </label>
                </div>

                <label class="block">
                  <span class="admin-label">Customer PIN (optional)</span>
                  <input v-model="form.customer_pin" type="text" maxlength="20" placeholder="KRA PIN for tax-compliant invoices" class="owner-input mt-1.5" />
                </label>

                <div>
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="admin-label">Line items</span>
                    <button type="button" class="text-xs font-bold text-primary" @click="addLine">+ Add item</button>
                  </div>
                  <div class="space-y-2">
                    <div v-for="(line, idx) in form.items" :key="idx" class="grid min-w-0 grid-cols-[minmax(0,1fr)_56px_88px_28px] items-center gap-1.5">
                      <input v-model="line.description" type="text" placeholder="Description" class="owner-input !min-h-8 !rounded-lg !py-1 !text-xs" />
                      <input v-model.number="line.quantity" type="number" min="1" placeholder="Qty" class="owner-input !min-h-8 !rounded-lg !py-1 text-center !text-xs" />
                      <input v-model.number="line.unit_price" type="number" min="0" placeholder="Price" class="owner-input !min-h-8 !rounded-lg !py-1 text-center !text-xs" />
                      <button type="button" class="owner-action-icon" @click="removeLine(idx)"><TrashIcon class="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="block">
                    <span class="admin-label">Discount (KES)</span>
                    <input v-model.number="form.discount" type="number" min="0" class="owner-input mt-1.5" />
                  </label>
                  <label class="block">
                    <span class="admin-label">Tax (KES)</span>
                    <input v-model.number="form.tax_amount" type="number" min="0" class="owner-input mt-1.5" />
                  </label>
                </div>

                <label class="block">
                  <span class="admin-label">Notes</span>
                  <textarea v-model="form.notes" rows="2" maxlength="500" class="owner-input mt-1.5 resize-none" placeholder="Terms, references, etc." />
                </label>

                <div class="flex items-baseline justify-between border-t border-slate-100 pt-2 text-sm">
                  <span class="font-medium text-slate-500">Subtotal {{ formSubtotal.toLocaleString() }}</span>
                  <span class="text-base font-black text-slate-950">Total: KES {{ formTotal.toLocaleString() }}</span>
                </div>

                <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" class="owner-secondary-action" @click="closeModal">Cancel</button>
                  <button type="submit" :disabled="!canSaveDraft || invoicesStore.saving" class="owner-primary-action">
                    {{ invoicesStore.saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save draft' }}
                  </button>
                </div>
              </form>

              <!-- View / act on an existing document -->
              <div v-else-if="detail" class="space-y-3">
                <div class="overflow-x-auto rounded-xl border border-slate-100">
                  <table class="w-full text-xs">
                    <thead class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr><th class="px-2.5 py-2 text-left">Description</th><th class="px-2.5 py-2 text-right">Qty</th><th class="px-2.5 py-2 text-right">Price</th><th class="px-2.5 py-2 text-right">Total</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-for="item in detail.items" :key="item.id">
                        <td class="px-2.5 py-2 font-semibold text-slate-800">{{ item.description }}</td>
                        <td class="px-2.5 py-2 text-right">{{ item.quantity }}</td>
                        <td class="px-2.5 py-2 text-right">{{ item.unit_price.toLocaleString() }}</td>
                        <td class="px-2.5 py-2 text-right">{{ item.line_total.toLocaleString() }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="space-y-1 text-sm">
                  <div class="flex justify-between text-slate-500"><span>Subtotal</span><span>{{ detail.subtotal.toLocaleString() }}</span></div>
                  <div v-if="detail.discount" class="flex justify-between text-slate-500"><span>Discount</span><span>-{{ detail.discount.toLocaleString() }}</span></div>
                  <div v-if="detail.tax_amount" class="flex justify-between text-slate-500"><span>Tax</span><span>{{ detail.tax_amount.toLocaleString() }}</span></div>
                  <div class="flex justify-between text-base font-black text-slate-950"><span>Total</span><span>KES {{ detail.total.toLocaleString() }}</span></div>
                  <div v-if="detail.amount_paid > 0" class="flex justify-between font-semibold text-emerald-600"><span>Paid</span><span>{{ detail.amount_paid.toLocaleString() }}</span></div>
                  <div v-if="detail.due_date" class="flex justify-between text-slate-400"><span>Due</span><span>{{ formatDate(detail.due_date) }}</span></div>
                </div>

                <div v-if="detail.payments?.length" class="rounded-xl bg-slate-50 p-2.5">
                  <p class="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Payment history</p>
                  <div v-for="p in detail.payments" :key="p.id" class="flex justify-between py-0.5 text-xs text-slate-600">
                    <span>{{ p.method }}{{ p.reference ? ` — ${p.reference}` : '' }}</span>
                    <span class="font-semibold">{{ p.amount.toLocaleString() }}</span>
                  </div>
                </div>

                <!-- Record payment form -->
                <div v-if="mode === 'pay'" class="space-y-2 rounded-xl border border-slate-100 p-3">
                  <div class="grid grid-cols-2 gap-2">
                    <input v-model.number="paymentForm.amount" type="number" min="1" :max="outstanding" placeholder="Amount" class="owner-input" />
                    <QeSelect v-model="paymentForm.method" :options="PAYMENT_METHOD_OPTIONS" placeholder="Method" />
                  </div>
                  <input v-model="paymentForm.reference" type="text" placeholder="Reference (optional)" class="owner-input" />
                </div>

                <!-- Write-off form -->
                <div v-if="mode === 'write-off'" class="space-y-2 rounded-xl border border-slate-100 p-3">
                  <p class="text-xs text-slate-500">Writing off KES {{ outstanding.toLocaleString() }} — this needs manager/owner approval before it's applied.</p>
                  <input v-model="writeOffReason" type="text" placeholder="Reason for write-off" class="owner-input" />
                </div>

                <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <button v-if="detail.status !== 'draft'" type="button" class="owner-secondary-action" :disabled="pdf.opening.value" @click="pdf.openPdf(`/api/invoices/${detail!.id}/pdf`)">
                    <ArrowDownTrayIcon class="h-4 w-4" /> PDF
                  </button>
                  <button v-if="detail.status === 'draft' && accessStore.can('billing.create')" type="button" class="owner-secondary-action" @click="startEdit">Edit</button>
                  <button v-if="detail.status === 'draft' && accessStore.can('billing.create')" type="button" class="owner-primary-action" @click="doAction(() => invoicesStore.sendInvoice(detail!.id))">Send</button>
                  <button v-if="canVoid && mode === 'view'" type="button" class="owner-secondary-action hover:!bg-red-50 hover:!text-red-600" @click="doAction(() => invoicesStore.voidInvoice(detail!.id))">Void</button>
                  <button v-if="canPay && mode !== 'pay'" type="button" class="owner-secondary-action" @click="mode = 'pay'; paymentForm.amount = outstanding">Record payment</button>
                  <button v-if="canPay && mode !== 'write-off'" type="button" class="owner-secondary-action hover:!bg-amber-50 hover:!text-amber-700" @click="mode = 'write-off'">Write off balance</button>
                  <button v-if="mode === 'pay'" type="button" class="owner-primary-action" :disabled="!canSubmitPayment || invoicesStore.saving" @click="submitPayment">
                    {{ invoicesStore.saving ? 'Saving…' : 'Confirm payment' }}
                  </button>
                  <button v-if="mode === 'write-off'" type="button" class="owner-primary-action" :disabled="!writeOffReason.trim() || invoicesStore.saving" @click="submitWriteOff">
                    {{ invoicesStore.saving ? 'Submitting…' : 'Submit for approval' }}
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
import { PlusIcon, XMarkIcon, TrashIcon, DocumentTextIcon, BanknotesIcon, UserIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { QeSelect, QePhoneInput } from '@qesuite/ui'
import { displayPhone } from '@qesuite/shared'
import { useInvoicesStore } from '@/stores/invoices'
import { useAccessStore } from '@/stores/access'
import { useDocumentPdf } from '@/composables/useDocumentPdf'
import { formatDate } from '@/composables/useDateFormat'
import { useRoute } from 'vue-router'
import type { Invoice, InvoiceType, InvoiceStatus, ArAgingRow } from '@qesuite/types'

const invoicesStore = useInvoicesStore()
const accessStore = useAccessStore()
const pdf = useDocumentPdf()
const route = useRoute()

const activeTab = ref<'invoices' | 'ar'>(route.query.tab === 'ar' ? 'ar' : 'invoices')
const customerFilter = ref<{ id: string; name: string } | null>(null)

function viewCustomerInvoices(row: ArAgingRow) {
  customerFilter.value = { id: row.customer_id, name: row.name }
  statusFilter.value = ''
  activeTab.value = 'invoices'
  invoicesStore.fetchInvoices({ customer_id: row.customer_id })
}

function clearCustomerFilter() {
  customerFilter.value = null
  invoicesStore.fetchInvoices({ status: statusFilter.value || undefined })
}
const tabOptions = [
  { value: 'invoices' as const, label: 'Invoices' },
  { value: 'ar' as const, label: 'Accounts Receivable' },
]

const statusFilter = ref('')
const statusFilters = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_paid', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
]

const TYPE_META: Record<InvoiceType, { label: string; draftLabel: string; prefix: string }> = {
  quotation: { label: 'Quotation', draftLabel: 'Draft quotation', prefix: 'QUO' },
  proforma: { label: 'Pro-forma', draftLabel: 'Draft pro-forma', prefix: 'PF' },
  invoice: { label: 'Invoice', draftLabel: 'Draft invoice', prefix: 'INV' },
  recurring: { label: 'Recurring', draftLabel: 'Draft recurring bill', prefix: 'REC' },
}
const typeOptions = Object.entries(TYPE_META).map(([value, meta]) => ({ value, label: meta.label }))

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-sky-100 text-sky-700',
  partially_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-400',
}
const AGING_CLASS: Record<string, string> = {
  '0-30': 'bg-emerald-50 text-emerald-700',
  '31-60': 'bg-amber-100 text-amber-700',
  '61-90': 'bg-orange-100 text-orange-700',
  '90+': 'bg-red-100 text-red-700',
}
const PAYMENT_METHOD_OPTIONS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
]

const showModal = ref(false)
const mode = ref<'create' | 'edit' | 'view' | 'pay' | 'write-off'>('create')
const detail = ref<Invoice | null>(null)
const editingId = ref<string | null>(null)
const writeOffReason = ref('')

const form = reactive<{
  type: InvoiceType; customer_name: string; customer_phone: string; customer_pin: string
  payment_terms_days: number; discount: number; tax_amount: number; notes: string
  items: { description: string; quantity: number; unit_price: number }[]
}>({
  type: 'invoice', customer_name: '', customer_phone: '', customer_pin: '',
  payment_terms_days: 0, discount: 0, tax_amount: 0, notes: '', items: [],
})

const paymentForm = reactive<{ amount: number; method: string; reference: string }>({ amount: 0, method: 'mpesa', reference: '' })

const formSubtotal = computed(() => form.items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unit_price || 0), 0))
const formTotal = computed(() => Math.max(0, formSubtotal.value - (form.discount || 0) + (form.tax_amount || 0)))
const canSaveDraft = computed(() =>
  !!form.customer_name.trim() && form.items.length > 0 &&
  form.items.every(i => i.description.trim() && i.quantity > 0 && i.unit_price >= 0)
)

const outstanding = computed(() => detail.value ? detail.value.total - detail.value.amount_paid : 0)
const canPay = computed(() => !!detail.value && ['sent', 'partially_paid', 'overdue'].includes(detail.value.status) && accessStore.can('billing.manage'))
const canVoid = computed(() => !!detail.value && ['draft', 'sent'].includes(detail.value.status) && detail.value.amount_paid === 0 && accessStore.can('billing.manage'))
const canSubmitPayment = computed(() => paymentForm.amount > 0 && paymentForm.amount <= outstanding.value && !!paymentForm.method)

function addLine() { form.items.push({ description: '', quantity: 1, unit_price: 0 }) }
function removeLine(idx: number) { form.items.splice(idx, 1) }

function openCreateForm() {
  mode.value = 'create'
  editingId.value = null
  detail.value = null
  Object.assign(form, { type: 'invoice', customer_name: '', customer_phone: '', customer_pin: '', payment_terms_days: 0, discount: 0, tax_amount: 0, notes: '' })
  form.items = [{ description: '', quantity: 1, unit_price: 0 }]
  showModal.value = true
}

async function openDetail(id: string) {
  const invoice = await invoicesStore.fetchInvoice(id)
  if (!invoice) return
  detail.value = invoice
  mode.value = 'view'
  writeOffReason.value = ''
  showModal.value = true
}

function startEdit() {
  if (!detail.value) return
  editingId.value = detail.value.id
  Object.assign(form, {
    type: detail.value.type, customer_name: detail.value.customer_name, customer_phone: detail.value.customer_phone || '',
    customer_pin: detail.value.customer_pin || '', payment_terms_days: detail.value.payment_terms_days,
    discount: detail.value.discount, tax_amount: detail.value.tax_amount, notes: detail.value.notes || '',
  })
  form.items = (detail.value.items || []).map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price }))
  mode.value = 'edit'
}

function closeModal() {
  showModal.value = false
  detail.value = null
  editingId.value = null
}

async function saveDraft() {
  if (!canSaveDraft.value) return
  const payload = {
    type: form.type, customer_name: form.customer_name, customer_phone: form.customer_phone || undefined,
    customer_pin: form.customer_pin || undefined, payment_terms_days: form.payment_terms_days || 0,
    discount: form.discount || 0, tax_amount: form.tax_amount || 0, notes: form.notes || undefined, items: form.items,
  }
  const ok = editingId.value ? await invoicesStore.updateInvoice(editingId.value, payload) : await invoicesStore.createInvoice(payload)
  if (ok) closeModal()
}

async function doAction(action: () => Promise<boolean>) {
  const ok = await action()
  if (ok) closeModal()
}

async function submitPayment() {
  if (!detail.value || !canSubmitPayment.value) return
  const ok = await invoicesStore.recordPayment(detail.value.id, {
    amount: paymentForm.amount, method: paymentForm.method, reference: paymentForm.reference || undefined,
  })
  if (ok) closeModal()
}

async function submitWriteOff() {
  if (!detail.value || !writeOffReason.value.trim()) return
  const ok = await invoicesStore.requestWriteOff(detail.value.id, writeOffReason.value.trim())
  if (ok) closeModal()
}

onMounted(() => {
  invoicesStore.fetchInvoices()
  invoicesStore.fetchAging()
})
</script>
