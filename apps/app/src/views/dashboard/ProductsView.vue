<template>
  <div class="p-3 sm:p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div>
        <h2 class="text-base font-bold text-gray-900 dark:text-white">Products</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ productsStore.total }} products</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <label class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl cursor-pointer transition-colors">
          <ArrowUpTrayIcon class="w-4 h-4" />
          <span class="hidden sm:inline">Import CSV</span>
          <input type="file" accept=".csv" class="hidden" @change="handleCsvImport" />
        </label>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
        >
          <PlusIcon class="w-4 h-4" />
          Add Product
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <div class="relative flex-1 min-w-48">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search products..."
          class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>
      <select
        v-model="selectedCategory"
        class="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      >
        <option value="">All categories</option>
        <option v-for="cat in categoriesStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <!-- View toggle -->
      <div class="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button @click="viewMode = 'grid'" :class="['p-2.5', viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700']">
          <Squares2X2Icon class="w-4 h-4" />
        </button>
        <button @click="viewMode = 'list'" :class="['p-2.5', viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700']">
          <ListBulletIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="productsStore.loading" :class="['gap-3', viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'flex flex-col']">
      <div v-for="i in 12" :key="i" :class="[viewMode === 'grid' ? 'skeleton h-44 rounded-xl' : 'skeleton h-12 rounded-lg']" />
    </div>

    <!-- Empty -->
    <div v-else-if="!productsStore.products.length" class="text-center py-10">
      <CubeIcon class="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
      <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">No products yet</p>
      <p class="text-xs text-gray-400 mt-0.5">Add your first product to start selling</p>
      <button @click="openAddModal" class="mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:opacity-90 shadow-md shadow-primary/20">
        Add Product
      </button>
    </div>

    <!-- GRID VIEW -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      <div
        v-for="product in productsStore.products"
        :key="product.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
      >
        <div class="relative aspect-square bg-gray-100 dark:bg-gray-700">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <CubeIcon class="w-8 h-8 text-gray-300 dark:text-gray-500" />
          </div>
          <!-- Badges -->
          <div class="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
            <span v-if="product.featured" class="px-1.5 py-0.5 bg-amber-400 text-white text-xs font-bold rounded-full leading-none">★</span>
            <span v-if="product.on_sale" class="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full leading-none">%</span>
            <span v-if="product.stock < 5" class="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full leading-none">!</span>
          </div>
          <!-- Actions overlay -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button @click="editProduct(product)" class="p-1.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
              <PencilIcon class="w-3.5 h-3.5" />
            </button>
            <button @click="confirmDelete(product.id)" class="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title="Delete">
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div class="p-2.5">
          <p class="font-medium text-gray-900 dark:text-white text-xs truncate">{{ product.name }}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-primary font-bold text-xs">KES {{ (product.sale_price || product.price).toLocaleString() }}</span>
            <span v-if="product.sale_price" class="text-xs text-gray-400 line-through">{{ product.price.toLocaleString() }}</span>
          </div>
          <p class="text-xs text-gray-400">Stk: {{ product.stock }}</p>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="divide-y divide-gray-50 dark:divide-gray-700">
        <div
          v-for="product in productsStore.products"
          :key="product.id"
          class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div class="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
            <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <CubeIcon class="w-4 h-4 text-gray-300 dark:text-gray-500" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ product.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ product.category?.name || 'No category' }}</p>
          </div>
          <div class="hidden sm:flex items-center gap-1.5">
            <span v-if="product.featured" class="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full dark:bg-amber-900/30 dark:text-amber-400">★</span>
            <span v-if="product.stock < 5" class="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full dark:bg-orange-900/30 dark:text-orange-400">Low</span>
          </div>
          <div class="text-right shrink-0">
            <p class="text-primary font-bold text-xs">KES {{ (product.sale_price || product.price).toLocaleString() }}</p>
            <p class="text-xs text-gray-400">{{ product.stock }} left</p>
          </div>
          <div class="flex items-center gap-0.5 shrink-0">
            <button @click="editProduct(product)" class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
              <PencilIcon class="w-3.5 h-3.5" />
            </button>
            <button @click="confirmDelete(product.id)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Form Modal -->
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
import { ref, watch, onMounted } from 'vue'
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
