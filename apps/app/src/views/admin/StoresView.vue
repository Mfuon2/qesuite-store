<template>
  <div class="admin-page space-y-5">
    <!-- Page header -->
    <section class="admin-page-hero">
      <div class="admin-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Stores</h1>
          <p class="owner-subtitle">
            Review storefronts, subscription state, trial windows, and platform performance.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="owner-stat-card p-3">
            <div class="owner-stat-icon h-10 w-10">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 8h1m4 0h1M9 12h1m4 0h1M9 16h1m4 0h1" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-950">{{ stores.total.toLocaleString() }}</p>
              <p class="text-xs font-medium text-slate-500">Total stores</p>
            </div>
          </div>
          <button class="admin-btn-secondary" @click="stores.fetchStores()">
            <svg :class="['h-4 w-4', stores.loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0019 5M19 5h-5M5 19h5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </section>

    <!-- Filters + Search -->
    <section class="admin-toolbar">
      <!-- Search -->
      <div class="admin-search-wrap max-w-xl">
        <svg class="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchInput"
          type="search"
          placeholder="Search by name, slug, phone..."
          class="admin-input pl-9"
          @input="handleSearch"
        />
      </div>

      <!-- Status filters -->
      <div class="admin-filter-bar">
        <button
          v-for="f in filters"
          :key="f.value"
          :class="['admin-filter-pill', stores.filter === f.value ? 'admin-filter-pill-active' : '']"
          @click="stores.setFilter(f.value)"
        >
          {{ f.label }}
        </button>
      </div>
    </section>

    <!-- Table -->
    <section class="admin-table-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-100/80 bg-slate-50/60">
            <tr>
              <th class="table-th cursor-pointer hover:text-slate-800" @click="stores.setSort('name')">
                Store
                <SortIcon :active="stores.sortBy === 'name'" :dir="stores.sortDir" />
              </th>
              <th class="table-th">Owner Phone</th>
              <th class="table-th cursor-pointer hover:text-slate-800" @click="stores.setSort('plan')">
                Plan
                <SortIcon :active="stores.sortBy === 'plan'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-800" @click="stores.setSort('subscription_status')">
                Status
                <SortIcon :active="stores.sortBy === 'subscription_status'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-800" @click="stores.setSort('trial_ends_at')">
                Trial Expiry
                <SortIcon :active="stores.sortBy === 'trial_ends_at'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-800 text-right" @click="stores.setSort('total_orders')">
                Orders
                <SortIcon :active="stores.sortBy === 'total_orders'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-800 text-right" @click="stores.setSort('total_gmv')">
                GMV
                <SortIcon :active="stores.sortBy === 'total_gmv'" :dir="stores.sortDir" />
              </th>
              <th class="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton -->
            <template v-if="stores.loading && stores.stores.length === 0">
              <tr v-for="i in 10" :key="i" class="border-b border-slate-100/80">
                <td class="table-td">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-200 animate-pulse"></div>
                    <div class="space-y-1">
                      <div class="h-3.5 w-28 bg-slate-200 rounded animate-pulse"></div>
                      <div class="h-2.5 w-20 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                </td>
                <td class="table-td"><div class="h-3.5 w-24 bg-slate-200 rounded animate-pulse"></div></td>
                <td class="table-td"><div class="h-5 w-16 bg-slate-200 rounded-full animate-pulse"></div></td>
                <td class="table-td"><div class="h-5 w-20 bg-slate-200 rounded-full animate-pulse"></div></td>
                <td class="table-td"><div class="h-3.5 w-20 bg-slate-200 rounded animate-pulse"></div></td>
                <td class="table-td text-right"><div class="h-3.5 w-10 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
                <td class="table-td text-right"><div class="h-3.5 w-16 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
                <td class="table-td text-right"><div class="h-7 w-20 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="stores.stores.length === 0">
              <td colspan="8" class="py-16 text-center text-slate-500">
                <svg class="mx-auto mb-3 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M19 21h2M5 21h-2" />
                </svg>
                <p class="text-sm font-bold text-slate-800">No stores found</p>
                <p class="mt-1 text-xs font-medium text-slate-500">Try another search or status filter.</p>
              </td>
            </tr>

            <!-- Data rows -->
            <StoreRow
              v-for="store in stores.stores"
              :key="store.id"
              :store="store"
              @view="goToStore"
              @suspend="openSuspend"
              @unsuspend="doUnsuspend"
              @extend="openExtend"
              @delete="openDelete"
            />
          </tbody>
        </table>
      </div>

      <!-- Datatable footer: rows-per-page + pagination -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100/80 bg-white/80 px-4 py-3">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span class="whitespace-nowrap">Rows per page:</span>
          <select
            :value="stores.limit"
            class="admin-select py-1.5"
            @change="onPageSizeChange"
          >
            <option v-for="n in [10, 25, 50, 100]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <Pagination
          :current="stores.page"
          :total-pages="Math.max(stores.totalPages, 1)"
          :total-items="stores.total"
          :page-size="stores.limit"
          @change="stores.setPage"
        />
      </div>
    </section>

    <!-- Suspend Modal -->
    <SuspendModal
      v-if="suspendTarget"
      :store-name="suspendTarget.name"
      @confirm="doSuspend"
      @cancel="suspendTarget = null"
    />

    <!-- Extend Trial Modal -->
    <ExtendTrialModal
      v-if="extendTarget"
      :store-name="extendTarget.name"
      @confirm="doExtend"
      @cancel="extendTarget = null"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-if="deleteTarget"
      title="Delete store permanently?"
      :message="`You are about to permanently delete &quot;${deleteTarget.name}&quot; and all its data.`"
      confirm-label="Delete permanently"
      :danger="true"
      require-text="DELETE"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useStoresStore, type AdminStore, type StoreFilter } from '@/stores/stores'
import { useDebounce } from '@/composables/useDebounce'
import { useAdminAction } from '@/composables/useAdminAction'
import StoreRow from '@/components/admin/StoreRow.vue'
import Pagination from '@/components/admin/Pagination.vue'
import SuspendModal from '@/components/admin/SuspendModal.vue'
import ExtendTrialModal from '@/components/admin/ExtendTrialModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'

const SortIcon = (props: { active: boolean; dir: string }) =>
  h('span', { class: 'ml-1 inline-block text-slate-500' },
    props.active ? (props.dir === 'asc' ? '↑' : '↓') : '')

const router = useRouter()
const stores = useStoresStore()
const { debounce } = useDebounce(300)
const { run } = useAdminAction()

const searchInput = ref('')
const suspendTarget = ref<AdminStore | null>(null)
const extendTarget = ref<AdminStore | null>(null)
const deleteTarget = ref<AdminStore | null>(null)

const filters: { value: StoreFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
]

function handleSearch() {
  debounce(() => stores.setSearch(searchInput.value))
}

function onPageSizeChange(e: Event) {
  stores.setLimit(Number((e.target as HTMLSelectElement).value))
}

function goToStore(id: string) {
  router.push({ name: 'admin-store-detail', params: { id } })
}

function openSuspend(store: AdminStore) {
  suspendTarget.value = store
}

function openExtend(store: AdminStore) {
  extendTarget.value = store
}

async function doSuspend(reason: string) {
  if (!suspendTarget.value) return
  const id = suspendTarget.value.id
  const name = suspendTarget.value.name
  suspendTarget.value = null
  await run(
    () => stores.suspend(id, reason),
    `${name} has been suspended.`,
    'Failed to suspend store.'
  )
}

function openDelete(store: AdminStore) {
  deleteTarget.value = store
}

async function doDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  const name = deleteTarget.value.name
  deleteTarget.value = null
  await run(
    () => stores.deleteStore(id),
    `${name} has been permanently deleted.`,
    'Failed to delete store.'
  )
}

async function doUnsuspend(store: AdminStore) {
  await run(
    () => stores.unsuspend(store.id),
    `${store.name} has been reactivated.`,
    'Failed to unsuspend store.'
  )
}

async function doExtend(days: number) {
  if (!extendTarget.value) return
  const id = extendTarget.value.id
  const name = extendTarget.value.name
  extendTarget.value = null
  await run(
    () => stores.extend(id, days),
    `${name}'s trial extended by ${days} days.`,
    'Failed to extend trial.'
  )
}

onMounted(() => stores.fetchStores())
</script>
