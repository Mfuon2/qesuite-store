<template>
  <div class="admin-page space-y-5">
    <section class="admin-page-hero">
      <div class="admin-page-header">
        <div class="min-w-0">
          <div class="owner-eyebrow">Revenue operations</div>
          <h1 class="owner-title">Platform Billing</h1>
          <p class="owner-subtitle">Track subscription payments, payment status, and store billing references.</p>
        </div>
        <div class="owner-stat-card p-3">
          <div class="owner-stat-icon h-10 w-10">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 7h20M4 11h16M7 15h4m9-9v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-950">{{ total.toLocaleString() }}</p>
            <p class="text-xs font-medium text-slate-500">Billing records</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="admin-toolbar">
      <div class="admin-search-wrap max-w-xl">
        <svg class="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div class="admin-filter-bar">
        <button
          v-for="s in statusFilters"
          :key="s.value"
          :class="['admin-filter-pill', statusFilter === s.value ? 'admin-filter-pill-active' : '']"
          @click="statusFilter = s.value; fetchData()"
        >
          {{ s.label }}
        </button>
      </div>
    </section>

    <!-- Table -->
    <section class="admin-table-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-100/80 bg-slate-50/60">
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
              class="table-tr"
            >
              <td class="table-td">
                <RouterLink
                  :to="{ name: 'admin-store-detail', params: { id: rec.store_id } }"
                  class="font-bold text-emerald-700 hover:text-emerald-800"
                >
                  {{ rec.store_name }}
                </RouterLink>
              </td>
              <td class="table-td">
                <span class="admin-pill bg-emerald-50 text-emerald-700 capitalize ring-1 ring-emerald-100">
                  {{ rec.plan ?? '—' }}
                </span>
              </td>
              <td class="table-td text-right font-semibold">
                {{ rec.currency }} {{ rec.amount.toLocaleString() }}
              </td>
              <td class="table-td capitalize">{{ rec.payment_method?.replace('_', ' ') ?? '—' }}</td>
              <td class="table-td text-slate-500 font-mono text-xs">{{ rec.reference ?? '—' }}</td>
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
              <td class="table-td text-slate-500">
                {{ rec.paid_at ? formatDate(rec.paid_at) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="border-t border-slate-100/80 bg-white/80 px-4 py-3">
        <Pagination
          :current="page"
          :total-pages="totalPages"
          :total-items="total"
          :page-size="pageSize"
          @change="onPageChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatDate } from '@/composables/useDateFormat'
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

onMounted(fetchData)
</script>
