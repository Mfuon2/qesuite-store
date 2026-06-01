<template>
  <div class="admin-table-card overflow-hidden">
    <div v-if="loading" class="p-8 flex items-center justify-center">
      <svg class="w-6 h-6 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
    <div v-else-if="records.length === 0" class="p-8 text-center text-slate-500">
      No billing history found.
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="border-b border-slate-100/80 bg-slate-50/60">
          <tr>
            <th class="table-th">Date</th>
            <th class="table-th text-right">Amount</th>
            <th class="table-th">Method</th>
            <th class="table-th">Reference</th>
            <th class="table-th">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rec in records"
            :key="rec.id"
            class="table-tr"
          >
            <td class="table-td text-slate-700">{{ formatDate(rec.created_at) }}</td>
            <td class="table-td text-right font-semibold text-slate-950">
              {{ rec.currency }} {{ rec.amount.toLocaleString() }}
            </td>
            <td class="table-td capitalize text-slate-700">{{ rec.payment_method?.replace('_', ' ') ?? '—' }}</td>
            <td class="table-td font-mono text-xs text-slate-500">{{ rec.reference ?? '—' }}</td>
            <td class="table-td">
              <span
                class="admin-pill"
                :class="rec.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700'
                  : rec.status === 'failed'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700'"
              >
                {{ rec.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatDate } from '@/composables/useDateFormat'
import { getStoreBillingHistory, type StoreBillingHistory } from '@/api/admin'

const props = defineProps<{ storeId: string }>()

const records = ref<StoreBillingHistory[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    records.value = await getStoreBillingHistory(props.storeId)
  } finally {
    loading.value = false
  }
})
</script>
