import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getStores,
  getStore,
  suspendStore,
  unsuspendStore,
  extendTrial,
  getImpersonationToken,
} from '@/api/admin'
import type { SubscriptionStatus, Plan } from '@qesuite/types'

export interface AdminStore {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_phone: string | null
  owner_email: string | null
  owner_name: string | null
  plan: Plan
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  is_suspended: boolean
  total_orders: number
  total_gmv: number
  created_at: string
}

export interface AdminStoreDetail extends AdminStore {
  address: string | null
  primary_color: string
  accent_color: string
  delivery_enabled: boolean
  pickup_enabled: boolean
  currency: string
}

export type StoreFilter = 'all' | 'active' | 'trialing' | 'suspended' | 'expired'

export const useStoresStore = defineStore('adminStores', () => {
  const stores = ref<AdminStore[]>([])
  const currentStore = ref<AdminStoreDetail | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const search = ref('')
  const filter = ref<StoreFilter>('all')
  const sortBy = ref<keyof AdminStore>('created_at')
  const sortDir = ref<'asc' | 'desc'>('desc')

  const totalPages = computed(() => Math.ceil(total.value / limit.value))

  async function fetchStores(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await getStores({
        page: page.value,
        limit: limit.value,
        search: search.value,
        status: filter.value === 'all' ? undefined : filter.value,
        sort_by: sortBy.value as string,
        sort_dir: sortDir.value,
      })
      stores.value = res.data
      total.value = res.meta.total
    } catch (err: unknown) {
      const e = err as { message?: string }
      error.value = e.message || 'Failed to load stores'
    } finally {
      loading.value = false
    }
  }

  async function fetchStore(id: string): Promise<void> {
    detailLoading.value = true
    try {
      currentStore.value = await getStore(id)
    } finally {
      detailLoading.value = false
    }
  }

  async function suspend(id: string, reason: string): Promise<void> {
    await suspendStore(id, reason)
    await fetchStores()
    if (currentStore.value?.id === id) {
      currentStore.value = { ...currentStore.value, is_suspended: true }
    }
  }

  async function unsuspend(id: string): Promise<void> {
    await unsuspendStore(id)
    await fetchStores()
    if (currentStore.value?.id === id) {
      currentStore.value = { ...currentStore.value, is_suspended: false }
    }
  }

  async function extend(id: string, days: number): Promise<void> {
    await extendTrial(id, days)
    await fetchStores()
    if (currentStore.value?.id === id) {
      await fetchStore(id)
    }
  }

  async function impersonate(id: string): Promise<string> {
    const { token } = await getImpersonationToken(id)
    return token
  }

  function setPage(p: number) {
    page.value = p
    fetchStores()
  }

  function setSearch(s: string) {
    search.value = s
    page.value = 1
    fetchStores()
  }

  function setFilter(f: StoreFilter) {
    filter.value = f
    page.value = 1
    fetchStores()
  }

  function setLimit(n: number) {
    limit.value = n
    page.value = 1
    fetchStores()
  }

  function setSort(col: keyof AdminStore) {
    if (sortBy.value === col) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = col
      sortDir.value = 'asc'
    }
    fetchStores()
  }

  return {
    stores,
    currentStore,
    loading,
    detailLoading,
    error,
    total,
    page,
    limit,
    search,
    filter,
    sortBy,
    sortDir,
    totalPages,
    fetchStores,
    fetchStore,
    suspend,
    unsuspend,
    extend,
    impersonate,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    setSort,
  }
})
