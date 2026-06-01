<template>
  <div class="owner-page">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <div class="owner-eyebrow">Catalog workspace</div>
          <h1 class="owner-title">Products</h1>
          <p class="owner-subtitle">
            Manage the items customers can browse, search, and add to cart from your public storefront.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label class="owner-secondary-action cursor-pointer">
            <ArrowUpTrayIcon class="h-4 w-4" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" class="hidden" @change="handleCsvImport" />
          </label>
          <button @click="openAddModal" class="owner-primary-action">
            <PlusIcon class="h-4 w-4" />
            Add product
          </button>
        </div>
      </div>
    </section>

    <section class="owner-stat-grid">
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <CubeIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ productsStore.total }}</p>
          <p class="text-xs font-medium text-slate-500">Total products</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-sky-50 text-sky-700 ring-sky-100">
          <Squares2X2Icon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ categoriesStore.categories.length }}</p>
          <p class="text-xs font-medium text-slate-500">Categories</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-amber-50 text-amber-700 ring-amber-100">
          <ArrowUpTrayIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ featuredCount }}</p>
          <p class="text-xs font-medium text-slate-500">Featured</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-orange-50 text-orange-700 ring-orange-100">
          <ListBulletIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ lowStockCount }}</p>
          <p class="text-xs font-medium text-slate-500">Low stock</p>
        </div>
      </div>
    </section>

    <section class="owner-toolbar">
      <div class="owner-search-wrap">
        <MagnifyingGlassIcon class="owner-search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Search products..."
          class="owner-search-input"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select v-model="selectedCategory" class="owner-select">
          <option value="">All categories</option>
          <option v-for="cat in categoriesStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <div class="owner-segmented" aria-label="Product view">
          <button
            @click="viewMode = 'grid'"
            :class="['owner-segment-button', viewMode === 'grid' ? 'owner-segment-button-active' : '']"
            title="Grid view"
          >
            <Squares2X2Icon class="h-4 w-4" />
          </button>
          <button
            @click="viewMode = 'list'"
            :class="['owner-segment-button', viewMode === 'list' ? 'owner-segment-button-active' : '']"
            title="List view"
          >
            <ListBulletIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>

    <div class="mt-5">
      <div v-if="productsStore.loading" :class="['gap-3', viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'flex flex-col']">
        <div v-for="i in 12" :key="i" :class="[viewMode === 'grid' ? 'skeleton h-56 rounded-[24px]' : 'skeleton h-16 rounded-[22px]']" />
      </div>

      <div v-else-if="!productsStore.products.length" class="owner-empty">
        <CubeIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No products yet</p>
        <p class="mt-1 text-sm text-slate-500">Add your first product to start selling.</p>
        <button @click="openAddModal" class="owner-primary-action mt-5">
          <PlusIcon class="h-4 w-4" />
          Add product
        </button>
      </div>

      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <div
          v-for="product in productsStore.products"
          :key="product.id"
          class="owner-card group overflow-hidden"
        >
          <div class="relative aspect-[4/3] bg-slate-50">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center">
              <CubeIcon class="h-9 w-9 text-slate-300" />
            </div>
            <div class="absolute left-2 top-2 flex flex-wrap gap-1">
              <span v-if="product.featured" class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">Feat</span>
              <span v-if="product.stock < 5" class="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black text-orange-700">Low</span>
            </div>
            <div class="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/42 opacity-0 transition-opacity group-hover:opacity-100">
              <button @click="editProduct(product)" class="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-700 shadow-lg transition hover:text-primary" title="Edit">
                <PencilIcon class="h-4 w-4" />
              </button>
              <button @click="confirmDelete(product.id)" class="grid h-9 w-9 place-items-center rounded-xl bg-red-500 text-white shadow-lg transition hover:bg-red-600" title="Delete">
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div class="p-3">
            <p class="truncate text-sm font-bold text-slate-950">{{ product.name }}</p>
            <p class="mt-0.5 truncate text-xs font-medium text-slate-400">{{ product.category?.name || 'No category' }}</p>
            <div class="mt-2 flex items-end justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-black text-primary">KES {{ (product.sale_price || product.price).toLocaleString() }}</p>
                <div v-if="product.sale_price" class="flex items-center gap-1.5 flex-wrap">
                  <p class="text-xs font-medium text-slate-400 line-through">KES {{ product.price.toLocaleString() }}</p>
                  <span class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">-{{ Math.round((1 - product.sale_price / product.price) * 100) }}%</span>
                </div>
              </div>
              <span class="rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">{{ product.stock }} left</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="owner-panel p-2 sm:p-2">
        <div class="space-y-2">
          <div
            v-for="product in productsStore.products"
            :key="product.id"
            class="owner-list-row flex items-center gap-3"
          >
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
              <img v-if="product.image_url" :src="product.image_url" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center">
                <CubeIcon class="h-5 w-5 text-slate-300" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-950">{{ product.name }}</p>
              <p class="truncate text-xs font-medium text-slate-500">{{ product.category?.name || 'No category' }}</p>
            </div>
            <div class="hidden items-center gap-1.5 md:flex">
              <span v-if="product.featured" class="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Featured</span>
              <span v-if="product.stock < 5" class="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">Low stock</span>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-black text-primary">KES {{ (product.sale_price || product.price).toLocaleString() }}</p>
              <div v-if="product.sale_price" class="flex items-center justify-end gap-1.5">
                <p class="text-[11px] font-medium text-slate-400 line-through">KES {{ product.price.toLocaleString() }}</p>
                <span class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">-{{ Math.round((1 - product.sale_price / product.price) * 100) }}%</span>
              </div>
              <p class="text-xs font-medium text-slate-400">{{ product.stock }} left</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button @click="editProduct(product)" class="owner-action-icon">
                <PencilIcon class="h-4 w-4" />
              </button>
              <button @click="confirmDelete(product.id)" class="owner-action-icon hover:bg-red-50 hover:text-red-500">
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <ProductFormModal
        v-if="showModal"
        :product="editingProduct"
        @close="closeModal"
        @saved="closeModal"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import {
  PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, PencilIcon, TrashIcon,
  Squares2X2Icon, ListBulletIcon, CubeIcon
} from '@heroicons/vue/24/outline'
import ProductFormModal from '@/components/dashboard/ProductFormModal.vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import { useConfirm } from '@/composables/useConfirm'
import type { Product, ProductCreate } from '@qesuite/types'

const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()
const { confirm } = useConfirm()

const viewMode = ref<'grid' | 'list'>('grid')
const search = ref('')
const selectedCategory = ref('')
const showModal = ref(false)
const editingProduct = ref<Product | null>(null)
const lowStockCount = computed(() => productsStore.products.filter(product => product.stock < 5).length)
const featuredCount = computed(() => productsStore.products.filter(product => product.featured).length)

let searchTimer: ReturnType<typeof setTimeout>

watch([search, selectedCategory], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    productsStore.fetchProducts({
      search: search.value || undefined,
      category_id: selectedCategory.value || undefined
    })
  }, 400)
})

function openAddModal() {
  editingProduct.value = null
  showModal.value = true
}

function editProduct(product: Product) {
  editingProduct.value = product
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
}

async function confirmDelete(id: string) {
  const ok = await confirm({
    title: 'Delete Product',
    message: 'Are you sure you want to delete this product? This cannot be undone.',
    confirmLabel: 'Delete',
    danger: true
  })
  if (ok) await productsStore.deleteProduct(id)
}

async function handleCsvImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const lines = text.trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const nameIdx = header.indexOf('name')
  const priceIdx = header.indexOf('price')
  const descIdx = header.indexOf('description')
  const stockIdx = header.indexOf('stock')
  if (nameIdx === -1 || priceIdx === -1) return

  const rows: ProductCreate[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const name = cols[nameIdx]?.trim()
    const price = parseFloat(cols[priceIdx]?.trim() || '0')
    if (!name || !price) continue
    rows.push({
      name,
      price,
      description: descIdx !== -1 ? cols[descIdx]?.trim() : undefined,
      stock: stockIdx !== -1 ? parseInt(cols[stockIdx]?.trim() || '999') : 999
    })
  }
  if (rows.length) await productsStore.bulkImport(rows)
}

onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts(),
    categoriesStore.fetchCategories()
  ])
})
</script>
