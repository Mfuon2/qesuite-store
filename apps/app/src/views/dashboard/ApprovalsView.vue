<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Approvals</h1>
          <p class="owner-subtitle">Sensitive actions — stock adjustments, expense edits, refunds, write-offs — wait here until a manager decides.</p>
        </div>
      </div>
    </section>

    <section class="mt-3">
      <div v-if="approvalsStore.loading" class="space-y-2">
        <div v-for="i in 4" :key="i" class="skeleton h-20 rounded-2xl" />
      </div>

      <div v-else-if="!approvalsStore.pending.length" class="owner-empty">
        <CheckCircleIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">Nothing waiting on you</p>
        <p class="mt-1 text-sm text-slate-500">New requests will show up here as staff submit them.</p>
      </div>

      <div v-else class="owner-panel space-y-2 !p-1.5">
        <div v-for="req in approvalsStore.pending" :key="req.id" class="owner-list-row flex flex-col gap-2 !items-stretch">
          <div class="flex items-start gap-3">
            <div class="owner-brand-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary ring-1">
              <component :is="ACTION_ICON[req.action_type]" class="h-4 w-4" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-slate-950">{{ describe(req) }}</p>
              <p v-if="req.reason" class="mt-0.5 truncate text-xs font-medium text-slate-500">Reason: {{ req.reason }}</p>
              <p class="mt-0.5 text-[11px] font-medium text-slate-400">Requested by {{ req.requested_by_name }} &middot; {{ formatDate(req.created_at) }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 pl-12">
            <input v-model="notes[req.id]" type="text" placeholder="Optional note" class="owner-input !min-h-8 min-w-0 flex-1 !rounded-lg !py-1 !text-xs" />
            <button type="button" class="owner-action-icon hover:!bg-red-50 hover:!text-red-600" :disabled="approvalsStore.deciding === req.id" @click="approvalsStore.decide(req.id, 'reject', notes[req.id])">
              <XMarkIcon class="h-4 w-4" />
            </button>
            <button type="button" class="owner-primary-action !min-h-8 !py-1.5 !text-xs" :disabled="approvalsStore.deciding === req.id" @click="approvalsStore.decide(req.id, 'approve', notes[req.id])">
              <CheckIcon class="h-4 w-4" /> Approve
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, type Component } from 'vue'
import { CheckCircleIcon, CheckIcon, XMarkIcon, ArchiveBoxIcon, ReceiptRefundIcon, BanknotesIcon, DocumentMinusIcon, CreditCardIcon } from '@heroicons/vue/24/outline'
import { useApprovalsStore } from '@/stores/approvals'
import { formatDate } from '@/composables/useDateFormat'
import type { ApprovalRequest, ApprovalActionType } from '@qesuite/types'

const approvalsStore = useApprovalsStore()
const notes = reactive<Record<string, string>>({})

const ACTION_ICON: Record<ApprovalActionType, Component> = {
  stock_adjustment: ArchiveBoxIcon,
  expense_edit: BanknotesIcon,
  expense_delete: BanknotesIcon,
  refund: ReceiptRefundIcon,
  credit_write_off: DocumentMinusIcon,
  credit_limit_override: CreditCardIcon,
}

function describe(req: ApprovalRequest): string {
  let payload: Record<string, unknown> = {}
  try { payload = JSON.parse(req.payload_json) } catch { /* leave empty */ }

  if (req.action_type === 'stock_adjustment') {
    const delta = payload.quantity_delta as number
    return `Adjust stock for ${payload.product_name ?? 'product'} by ${delta > 0 ? '+' : ''}${delta}`
  }
  if (req.action_type === 'expense_edit') {
    const fields = Object.keys(payload).filter(k => payload[k] !== undefined)
    return `Edit expense — changing ${fields.join(', ') || 'details'}`
  }
  if (req.action_type === 'expense_delete') return 'Delete an expense record'
  if (req.action_type === 'refund') return `Refund request${payload.amount ? ` — KES ${payload.amount}` : ''}`
  if (req.action_type === 'credit_write_off') return `Write off customer credit balance${payload.amount ? ` — KES ${payload.amount}` : ''}`
  if (req.action_type === 'credit_limit_override') return 'POS credit sale over the customer\'s credit limit'
  return req.action_type
}

onMounted(() => approvalsStore.fetchPending())
</script>
