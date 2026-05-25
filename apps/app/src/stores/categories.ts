import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory, apiReorderCategories } from '@/api/categories'
import type { Category, CategoryCreate, CategoryUpdate } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const { showToast } = useToast()

  async function fetchCategories() {
    loading.value = true
    try {
      const res = await apiGetCategories()
      if (res.success && res.data) categories.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load categories', 'error')
    } finally {
      loading.value = false
    }
  }

  async function createCategory(payload: CategoryCreate): Promise<Category | null> {
    saving.value = true
    try {
      const res = await apiCreateCategory(payload)
      if (res.success && res.data) {
        categories.value.push(res.data)
        showToast('Category created', 'success')
        return res.data
      }
      return null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create category', 'error')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateCategory(id: string, payload: CategoryUpdate): Promise<Category | null> {
    saving.value = true
    try {
      const res = await apiUpdateCategory(id, payload)
      if (res.success && res.data) {
        const idx = categories.value.findIndex(c => c.id === id)
        if (idx !== -1) categories.value[idx] = res.data
        showToast('Category updated', 'success')
        return res.data
      }
      return null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update category', 'error')
      return null
    } finally {
      saving.value = false
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      await apiDeleteCategory(id)
      categories.value = categories.value.filter(c => c.id !== id)
      showToast('Category deleted', 'success')
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete category', 'error')
      return false
    }
  }

  async function reorder(ids: string[]) {
    // Optimistically update
    const sorted = ids.map(id => categories.value.find(c => c.id === id)!).filter(Boolean)
    categories.value = sorted
    try {
      await apiReorderCategories(ids)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reorder', 'error')
      await fetchCategories()
    }
  }

  return {
    categories,
    loading,
    saving,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorder
  }
})
