<template>
  <div class="p-4 space-y-4">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold text-white">Stores</h1>
        <p class="text-slate-400 text-xs">
          {{ stores.total }} stores total
        </p>
      </div>
    </div>

    <!-- Filters + Search -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1 max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in filters"
          :key="f.value"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="stores.filter === f.value
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          @click="stores.setFilter(f.value)"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-700">
            <tr>
              <th class="table-th cursor-pointer hover:text-slate-200" @click="stores.setSort('name')">
                Store
                <SortIcon :active="stores.sortBy === 'name'" :dir="stores.sortDir" />
              </th>
              <th class="table-th">Owner Phone</th>
              <th class="table-th cursor-pointer hover:text-slate-200" @click="stores.setSort('plan')">
                Plan
                <SortIcon :active="stores.sortBy === 'plan'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-200" @click="stores.setSort('subscription_status')">
                Status
                <SortIcon :active="stores.sortBy === 'subscription_status'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-200" @click="stores.setSort('trial_ends_at')">
                Trial Expiry
                <SortIcon :active="stores.sortBy === 'trial_ends_at'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-200 text-right" @click="stores.setSort('total_orders')">
                Orders
                <SortIcon :active="stores.sortBy === 'total_orders'" :dir="stores.sortDir" />
              </th>
              <th class="table-th cursor-pointer hover:text-slate-200 text-right" @click="stores.setSort('total_gmv')">
                GMV
                <SortIcon :active="stores.sortBy === 'total_gmv'" :dir="stores.sortDir" />
              </th>
              <th class="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton -->
            <template v-if="stores.loading && stores.stores.length === 0">
              <tr v-for="i in 10" :key="i" class="border-b border-slate-700/50">
                <td class="table-td">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-700 animate-pulse"></div>
                    <div class="space-y-1">
                      <div class="h-3.5 w-28 bg-slate-700 rounded animate-pulse"></div>
                      <div class="h-2.5 w-20 bg-slate-700/60 rounded animate-pulse"></div>
                    </div>
                  </div>
                </td>
                <td class="table-td"><div class="h-3.5 w-24 bg-slate-700 rounded animate-pulse"></div></td>
                <td class="table-td"><div class="h-5 w-16 bg-slate-700 rounded-full animate-pulse"></div></td>
                <td class="table-td"><div class="h-5 w-20 bg-slate-700 rounded-full animate-pulse"></div></td>
                <td class="table-td"><div class="h-3.5 w-20 bg-slate-700 rounded animate-pulse"></div></td>
                <td class="table-td text-right"><div class="h-3.5 w-10 bg-slate-700 rounded animate-pulse ml-auto"></div></td>
                <td class="table-td text-right"><div class="h-3.5 w-16 bg-slate-700 rounded animate-pulse ml-auto"></div></td>
                <td class="table-td text-right"><div class="h-7 w-20 bg-slate-700 rounded animate-pulse ml-auto"></div></td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="stores.stores.length === 0">
              <td colspan="8" class="text-center py-16 text-slate-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M19 21h2M5 21h-2" />
                </svg>
                No stores found
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
            />
          </tbody>
        </table>
      </div>

      <!-- Datatable footer: rows-per-page + pagination -->
      <div class="border-t border-slate-700 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-2 text-sm text-slate-400">
          <span class="whitespace-nowrap">Rows per page:</span>
          <select
            :value="stores.limit"
            class="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
    </div>

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
