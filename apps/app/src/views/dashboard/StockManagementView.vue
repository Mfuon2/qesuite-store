<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Stock Management</h1>
          <p class="owner-subtitle">
            Keep quantities accurate so customers never order something you don't have on the shelf.
          </p>
        </div>
      </div>
    </section>

    <section class="owner-stat-grid hidden sm:grid">
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <ArchiveBoxIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ productsStore.products.length }}</p>
          <p class="text-xs font-medium text-slate-500">Tracked products</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-orange-50 text-orange-700 ring-orange-100">
          <ExclamationTriangleIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ lowStockCount }}</p>
          <p class="text-xs font-medium text-slate-500">Low stock</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-red-50 text-red-700 ring-red-100">
          <NoSymbolIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ outOfStockCount }}</p>
          <p class="text-xs font-medium text-slate-500">Out of stock</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-emerald-50 text-emerald-700 ring-emerald-100">
          <BanknotesIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">KES {{ stockValue.toLocaleString() }}</p>
          <p class="text-xs font-medium text-slate-500">Stock on hand value</p>
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

      <div class="owner-segmented" aria-label="Sort">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          @click="sortBy = opt.value"
          :class="['owner-segment-button', sortBy === opt.value ? 'owner-segment-button-active' : '']"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <section class="mt-3">
      <div v-if="productsStore.loading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="skeleton h-16 rounded-2xl" />
      </div>

      <div v-else-if="!filteredProducts.length" class="owner-empty">
        <ArchiveBoxIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No products found</p>
        <p class="mt-1 text-sm text-slate-500">Try a different search, or add products from the Products page.</p>
      </div>

      <div v-else class="owner-panel space-y-1.5 !p-1.5">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="owner-list-row flex items-center gap-3"
        >
          <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-50">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
            <div v-else class="grid h-full w-full place-items-center text-slate-300">
              <CubeIcon class="h-5 w-5" />
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-950">{{ product.name }}</p>
            <p class="truncate text-xs font-medium text-slate-400">{{ product.category?.name || 'Uncategorised' }}</p>
          </div>

          <span
            :class="[
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black',
              product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock < LOW_STOCK_THRESHOLD ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'
            ]"
          >
            {{ product.stock === 0 ? 'Out of stock' : product.stock < LOW_STOCK_THRESHOLD ? 'Low stock' : 'In stock' }}
          </span>

          <div v-if="canEditStock" class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="owner-action-icon"
              :disabled="savingId === product.id || product.stock <= 0"
              @click="adjustStock(product, -1)"
            >
              <MinusIcon class="h-4 w-4" />
            </button>
            <input
              type="number"
              min="0"
              class="owner-input !min-h-8 w-16 !rounded-lg !py-1 text-center !text-xs"
              :value="product.stock"
              :disabled="savingId === product.id"
              @change="onStockInput(product, $event)"
            />
            <button
              type="button"
              class="owner-action-icon"
              :disabled="savingId === product.id"
              @click="adjustStock(product, 1)"
            >
              <PlusIcon class="h-4 w-4" />
            </button>
          </div>
          <p v-else class="w-24 shrink-0 text-right text-sm font-black text-slate-950">{{ product.stock }} left</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArchiveBoxIcon, ExclamationTriangleIcon, NoSymbolIcon, BanknotesIcon,
  MagnifyingGlassIcon, CubeIcon, MinusIcon, PlusIcon,
} from '@heroicons/vue/24/outline'
import { useProductsStore } from '@/stores/products'
import { useAccessStore } from '@/stores/access'
import { useToast } from '@/composables/useToast'
import type { Product } from '@qesuite/types'

// Mirrors the "Low stock" threshold already used on the Products page —
// keep these in sync rather than inventing a second number.
const LOW_STOCK_THRESHOLD = 5

const productsStore = useProductsStore()
const accessStore = useAccessStore()
const { showToast } = useToast()

const search = ref('')
const sortBy = ref<'stock-asc' | 'name'>('stock-asc')
const savingId = ref<string | null>(null)

const sortOptions = [
  { value: 'stock-asc' as const, label: 'Lowest stock first' },
  { value: 'name' as const, label: 'Name' },
]

const canEditStock = computed(() => accessStore.can('products.edit'))

const lowStockCount = computed(() =>
  productsStore.products.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length
)
const outOfStockCount = computed(() => productsStore.products.filter(p => p.stock === 0).length)
const stockValue = computed(() =>
  productsStore.products.reduce((sum, p) => sum + p.stock * p.price, 0)
)

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = q
    ? productsStore.products.filter(p => p.name.toLowerCase().includes(q))
    : productsStore.products.slice()

  return list.sort((a, b) =>
    sortBy.value === 'stock-asc' ? a.stock - b.stock : a.name.localeCompare(b.name)
  )
})

async function saveStock(product: Product, newStock: number) {
  const clamped = Math.max(0, Math.round(newStock))
  if (clamped === product.stock) return
  savingId.value = product.id
  const updated = await productsStore.updateProduct(product.id, { stock: clamped })
  savingId.value = null
  if (!updated) showToast('Failed to update stock', 'error')
}

function adjustStock(product: Product, delta: number) {
  saveStock(product, product.stock + delta)
}

function onStockInput(product: Product, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isNaN(value)) return
  saveStock(product, value)
}

onMounted(() => {
  if (!productsStore.products.length) productsStore.fetchProducts()
})
</script>
