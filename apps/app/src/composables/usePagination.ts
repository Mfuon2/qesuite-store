import { ref, computed } from 'vue'

/**
 * Centralises pagination state and helpers.
 * Eliminates the repeated currentPage / totalPages / total refs across admin views.
 *
 * Usage:
 *   const { page, totalPages, total, pageSize, setMeta, changePage } = usePagination()
 *   // after API call:
 *   setMeta(res.meta)
 *   // in template:
 *   <Pagination :current="page" :total-pages="totalPages" :total-items="total"
 *               :page-size="pageSize" @change="changePage" />
 */
export function usePagination(defaultPageSize = 20) {
  const page = ref(1)
  const total = ref(0)
  const totalPages = ref(1)
  const pageSize = ref(defaultPageSize)

  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  function setMeta(meta: { page: number; total: number; total_pages: number; limit?: number }) {
    page.value = meta.page
    total.value = meta.total
    totalPages.value = meta.total_pages
    if (meta.limit) pageSize.value = meta.limit
  }

  function changePage(p: number) {
    page.value = p
  }

  function resetPage() {
    page.value = 1
  }

  return {
    page,
    total,
    totalPages,
    pageSize,
    hasPrev,
    hasNext,
    setMeta,
    changePage,
    resetPage,
  }
}
