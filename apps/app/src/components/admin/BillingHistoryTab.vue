<template>
  <div class="admin-card overflow-hidden">
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
        <thead class="border-b border-slate-700">
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
            class="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
          >
            <td class="table-td text-slate-300">{{ formatDate(rec.created_at) }}</td>
            <td class="table-td text-right font-semibold text-white">
              {{ rec.currency }} {{ rec.amount.toLocaleString() }}
            </td>
            <td class="table-td capitalize text-slate-300">{{ rec.payment_method?.replace('_', ' ') ?? '—' }}</td>
            <td class="table-td font-mono text-xs text-slate-400">{{ rec.reference ?? '—' }}</td>
            <td class="table-td">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="rec.status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : rec.status === 'failed'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'"
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
import { getStoreBillingHistory, type StoreBillingHistory } from '@/api/admin'

const props = defineProps<{ storeId: string }>()

const records = ref<StoreBillingHistory[]>([])
const loading = ref(false)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

onMounted(async () => {
  loading.value = true
  try {
    records.value = await getStoreBillingHistory(props.storeId)
  } finally {
    loading.value = false
  }
})
</script>
