import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiGetProducts, apiGetProduct, apiCreateProduct,
  apiUpdateProduct, apiDeleteProduct, apiBulkImportProducts,
  apiGetUploadUrl
} from '@/api/products'
import type { Product, ProductCreate, ProductUpdate } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const total = ref(0)
  const lastFetchedAt = ref(0)
  const { showToast } = useToast()

  async function fetchProducts(params?: { category_id?: string; search?: string; page?: number }, { force = false } = {}) {
    // Skip re-fetch if called within 30s without changed params (navigating back to products page)
    const isDefaultFetch = !params?.category_id && !params?.search && !params?.page
    if (!force && isDefaultFetch && products.value.length > 0 && Date.now() - lastFetchedAt.value < 30_000) return

    loading.value = true
    try {
      const res = (await apiGetProducts({ ...params, limit: 50 })) as unknown as { data: { items: Product[]; total: number } | null }
      products.value = res.data?.items || []
      total.value = res.data?.total || 0
      if (isDefaultFetch) lastFetchedAt.value = Date.now()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load products', 'error')
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(id: string) {
    try {
      const res = await apiGetProduct(id)
      if (res.success && res.data) currentProduct.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load product', 'error')
    }
  }

  async function createProduct(payload: ProductCreate): Promise<Product | null> {
    saving.value = true
    try {
      const res = await apiCreateProduct(payload)
      // Backend returns { data: product, error, message } — no `success` field.
      // apiFetch throws on non-2xx so reaching here means the request succeeded.
      if (res.data) {
        products.value.unshift(res.data)
        lastFetchedAt.value = Date.now()
        showToast('Product created', 'success')
        return res.data
      }
      return null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create product', 'error')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateProduct(id: string, payload: ProductUpdate): Promise<Product | null> {
    saving.value = true
    try {
      const res = await apiUpdateProduct(id, payload)
      if (res.data) {
        const idx = products.value.findIndex(p => p.id === id)
        if (idx !== -1) products.value[idx] = res.data
        if (currentProduct.value?.id === id) currentProduct.value = res.data
        showToast('Product updated', 'success')
        return res.data
      }
      return null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update product', 'error')
      return null
    } finally {
      saving.value = false
    }
  }

  async function deleteProduct(id: string): Promise<boolean> {
    try {
      await apiDeleteProduct(id)
      products.value = products.value.filter(p => p.id !== id)
      showToast('Product deleted', 'success')
      return true
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete product', 'error')
      return false
    }
  }

  async function bulkImport(rows: ProductCreate[]): Promise<{ imported: number; errors: string[] } | null> {
    saving.value = true
    try {
      const res = await apiBulkImportProducts(rows)
      if (res.data) {
        await fetchProducts()
        showToast(`Imported ${res.data.imported} products`, 'success')
        return res.data
      }
      return null
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Bulk import failed', 'error')
      return null
    } finally {
      saving.value = false
    }
  }

  async function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<string | null> {
    try {
      const presignRes = await apiGetUploadUrl(file.name, file.type)
      if (!presignRes.data) throw new Error('Failed to get upload URL')
      const { upload_url, public_url } = presignRes.data

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100))
        })
        xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error(`Upload error ${xhr.status}`)))
        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.open('PUT', upload_url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })
      return public_url
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Image upload failed', 'error')
      return null
    }
  }

  return {
    products,
    currentProduct,
    loading,
    saving,
    total,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkImport,
    uploadImage
  }
})
