<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white">Platform Billing</h1>
      <p class="text-slate-400 text-sm mt-0.5">All subscription payments across stores</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchInput"
          type="search"
          placeholder="Search by store, reference..."
          class="admin-input pl-9"
          @input="handleSearch"
        />
      </div>
      <div class="flex gap-2">
        <button
          v-for="s in statusFilters"
          :key="s.value"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="statusFilter === s.value
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          @click="statusFilter = s.value; fetchData()"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-700">
            <tr>
              <th class="table-th">Store</th>
              <th class="table-th">Plan</th>
              <th class="table-th text-right">Amount</th>
              <th class="table-th">Method</th>
              <th class="table-th">Reference</th>
              <th class="table-th">Status</th>
              <th class="table-th">Paid At</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && records.length === 0">
              <tr>
                <td colspan="7"><LoadingSpinner height="sm" /></td>
              </tr>
            </template>
            <tr v-else-if="records.length === 0">
              <td colspan="7"><EmptyState icon="billing" message="No billing records found" size="sm" /></td>
            </tr>
            <tr
              v-for="rec in records"
              :key="rec.id"
              class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
            >
              <td class="table-td">
                <RouterLink
                  :to="{ name: 'admin-store-detail', params: { id: rec.store_id } }"
                  class="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {{ rec.store_name }}
                </RouterLink>
              </td>
              <td class="table-td">
                <span class="px-2 py-0.5 bg-slate-700 rounded text-xs font-medium capitalize">
                  {{ rec.plan ?? '—' }}
                </span>
              </td>
              <td class="table-td text-right font-semibold">
                {{ rec.currency }} {{ rec.amount.toLocaleString() }}
              </td>
              <td class="table-td capitalize">{{ rec.payment_method?.replace('_', ' ') ?? '—' }}</td>
              <td class="table-td text-slate-400 font-mono text-xs">{{ rec.reference ?? '—' }}</td>
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
              <td class="table-td text-slate-400">
                {{ rec.paid_at ? formatDate(rec.paid_at) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="border-t border-slate-700 px-4 py-3">
        <Pagination
          :current="page"
          :total-pages="totalPages"
          :total-items="total"
          :page-size="pageSize"
          @change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getPlatformBilling, type PlatformBillingRecord } from '@/api/admin'
import Pagination from '@/components/admin/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useDebounce } from '@/composables/useDebounce'
import { usePagination } from '@/composables/usePagination'

const { debounce } = useDebounce(300)
const { page, total, totalPages, pageSize, setMeta, changePage, resetPage } = usePagination(20)

const records = ref<PlatformBillingRecord[]>([])
const loading = ref(false)
const searchInput = ref('')
const statusFilter = ref('all')

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await getPlatformBilling({
      page: page.value,
      limit: pageSize.value,
      search: searchInput.value || undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    })
    records.value = res.data
    setMeta(res.meta)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  debounce(() => {
    resetPage()
    fetchData()
  })
}

function onPageChange(p: number) {
  changePage(p)
  fetchData()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

onMounted(fetchData)
</script>
