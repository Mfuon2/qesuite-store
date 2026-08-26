<template>
  <section class="py-3 sm:py-5">
    <div class="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="hidden space-y-4 lg:block">
        <div class="qs-card-soft p-4">
          <h2 class="text-base font-extrabold text-slate-950">Categories</h2>
          <div class="mt-3 space-y-1">
            <button
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition"
              :class="activeCategory === null ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'"
              @click="selectCategory(null)"
            >
              <Squares2X2Icon class="h-4 w-4" />
              All Products
            </button>
            <button
              v-for="cat in store.categories"
              :key="cat.id"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition"
              :class="activeCategory === cat.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'"
              @click="selectCategory(cat.id)"
            >
              <span v-if="cat.icon" class="text-base">{{ cat.icon }}</span>
              <TagIcon v-else class="h-4 w-4" />
              <span class="truncate">{{ cat.name }}</span>
            </button>
          </div>
        </div>

        <div class="qs-card-soft p-4">
          <h2 class="text-base font-extrabold text-slate-950">Filters</h2>
          <div class="mt-4 space-y-4">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-wide text-slate-400">Price</p>
              <label v-for="range in priceRanges" :key="range.id" class="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  v-model="selectedPriceRanges"
                  type="checkbox"
                  :value="range.id"
                  class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                />
                {{ range.label }}
              </label>
            </div>
            <div>
              <p class="text-xs font-extrabold uppercase tracking-wide text-slate-400">Options</p>
              <label v-for="option in filterOptions" :key="option.id" class="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  v-model="selectedOptions"
                  type="checkbox"
                  :value="option.id"
                  class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                />
                {{ option.label }}
              </label>
            </div>
            <button
              v-if="filtersActive"
              class="text-sm font-bold text-emerald-700"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>
        </div>
      </aside>

      <div class="min-w-0">
        <div class="mb-3 flex items-end justify-between gap-2 sm:mb-4">
          <div>
            <h2 class="text-lg font-extrabold leading-tight text-slate-950 sm:text-xl">{{ activeCategoryName }}</h2>
            <p class="mt-0.5 text-xs font-medium text-slate-500 sm:mt-1 sm:text-sm">
              <template v-if="loading">Loading products...</template>
              <template v-else>{{ sortedProducts.length }} available items</template>
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <label class="sr-only" for="product-sort">Sort products</label>
            <select
              id="product-sort"
              v-model="sortBy"
              class="h-9 max-w-[6.75rem] rounded-xl border border-slate-100 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.03)] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:h-10 sm:max-w-none sm:px-4 sm:text-sm"
            >
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="newest">Newest</option>
            </select>
            <button
              class="grid h-9 w-9 place-items-center rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.18)] sm:h-10 sm:w-10"
              :class="viewMode === 'grid' ? 'bg-emerald-700 text-white' : 'border border-slate-100 bg-white text-slate-600'"
              @click="viewMode = 'grid'"
              aria-label="Grid view"
            >
              <Squares2X2Icon class="h-4 w-4" />
            </button>
            <button
              class="grid h-9 w-9 place-items-center rounded-xl sm:h-10 sm:w-10"
              :class="viewMode === 'compact' ? 'bg-emerald-700 text-white shadow-[0_8px_20px_rgba(16,185,129,0.18)]' : 'border border-slate-100 bg-white text-slate-600'"
              @click="viewMode = 'compact'"
              aria-label="Compact view"
            >
              <ListBulletIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <template v-if="loading">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <SkeletonCard v-for="i in 8" :key="i" />
          </div>
        </template>

        <template v-else-if="sortedProducts.length > 0">
          <TransitionGroup
            name="product-grid"
            tag="div"
            :class="[
              'grid gap-3',
              viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            ]"
          >
            <ProductCard
              v-for="product in sortedProducts"
              :key="product.id"
              :product="product"
            />
          </TransitionGroup>
        </template>

        <template v-else>
          <div class="qs-card-soft flex flex-col items-center justify-center border-dashed py-16 text-center">
            <ShoppingBagIcon class="h-12 w-12 text-slate-300" />
            <h3 class="mt-3 text-base font-extrabold text-slate-700">
              {{ $t('product.no_products') }}
            </h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ $t('product.no_products_hint') }}
            </p>
          </div>
        </template>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <Transition name="filter-sheet">
      <div v-if="store.mobileFilterOpen" class="fixed inset-0 z-50 lg:hidden">
        <button
          class="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
          aria-label="Close filters"
          @click="store.closeMobileFilters"
        ></button>
        <div class="absolute inset-x-0 bottom-0 rounded-t-[1.6rem] bg-white p-4 shadow-2xl">
          <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200"></div>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-extrabold text-slate-950">Filter products</h2>
              <p class="text-xs font-medium text-slate-500">{{ sortedProducts.length }} matching items</p>
            </div>
            <button
              class="grid h-9 w-9 place-items-center rounded-xl border border-slate-100 text-slate-600"
              aria-label="Close filters"
              @click="store.closeMobileFilters"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div class="mt-4 grid gap-4">
            <div>
              <label for="mobile-product-sort" class="text-xs font-extrabold uppercase tracking-wide text-slate-400">Sort</label>
              <select
                id="mobile-product-sort"
                v-model="sortBy"
                class="mt-2 h-11 w-full rounded-2xl border border-slate-100 bg-white px-3 text-sm font-bold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.03)] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="popular">Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <div>
              <p class="text-xs font-extrabold uppercase tracking-wide text-slate-400">Price</p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <label
                  v-for="range in priceRanges"
                  :key="range.id"
                  class="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600"
                >
                  <input
                    v-model="selectedPriceRanges"
                    type="checkbox"
                    :value="range.id"
                    class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  {{ range.label }}
                </label>
              </div>
            </div>

            <div>
              <p class="text-xs font-extrabold uppercase tracking-wide text-slate-400">Options</p>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <label
                  v-for="option in filterOptions"
                  :key="option.id"
                  class="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600"
                >
                  <input
                    v-model="selectedOptions"
                    type="checkbox"
                    :value="option.id"
                    class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  {{ option.label }}
                </label>
              </div>
            </div>
          </div>

          <div class="mt-5 flex gap-2">
            <button
              class="h-11 flex-1 rounded-2xl border border-slate-100 text-sm font-extrabold text-slate-700"
              @click="clearFilters"
            >
              Clear
            </button>
            <button
              class="h-11 flex-1 rounded-2xl bg-emerald-700 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(16,185,129,0.22)]"
              @click="store.closeMobileFilters"
            >
              Show products
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ListBulletIcon, ShoppingBagIcon, Squares2X2Icon, TagIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import ProductCard from './ProductCard.vue'
import SkeletonCard from './SkeletonCard.vue'
import type { Product } from '@qesuite/types'
import { parseAppTimestamp } from '@qesuite/shared'

const props = defineProps<{
  activeCategory: string | null
}>()

const emit = defineEmits<{
  'update:activeCategory': [value: string | null]
}>()

const store = useStorefrontStore()

const priceRanges = [
  { id: '0-100', label: 'KES 0 - 100', min: 0, max: 100 },
  { id: '100-500', label: 'KES 100 - 500', min: 100, max: 500 },
  { id: '500-1000', label: 'KES 500 - 1,000', min: 500, max: 1000 },
  { id: '1000+', label: 'KES 1,000+', min: 1000, max: Number.POSITIVE_INFINITY },
]
const filterOptions = [
  { id: 'featured', label: 'Featured' },
  { id: 'on-sale', label: 'On sale' },
  { id: 'available', label: 'Available now' },
]

const selectedPriceRanges = ref<string[]>([])
const selectedOptions = ref<string[]>([])
const sortBy = ref<'popular' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest'>('popular')
const viewMode = ref<'grid' | 'compact'>('grid')

const loading = computed(() => store.productsLoading)

const filteredProducts = computed(() => {
  let products = store.activeProducts

  if (props.activeCategory !== null) {
    products = products.filter((p) => p.category_id === props.activeCategory)
  }

  const query = store.searchQuery.trim().toLowerCase()
  if (query) {
    products = products.filter((product) => {
      const categoryName = store.categories.find((cat) => cat.id === product.category_id)?.name ?? ''
      return [
        product.name,
        product.description ?? '',
        categoryName,
      ].some((value) => value.toLowerCase().includes(query))
    })
  }

  if (selectedPriceRanges.value.length > 0) {
    const activeRanges = priceRanges.filter((range) => selectedPriceRanges.value.includes(range.id))
    products = products.filter((product) => {
      const price = productPrice(product)
      return activeRanges.some((range) => price >= range.min && price <= range.max)
    })
  }

  if (selectedOptions.value.includes('featured')) {
    products = products.filter((product) => product.featured)
  }
  if (selectedOptions.value.includes('on-sale')) {
    products = products.filter((product) => product.on_sale && product.sale_price !== null)
  }
  if (selectedOptions.value.includes('available')) {
    products = products.filter((product) => product.stock > 0 && product.is_active)
  }

  return products
})

const sortedProducts = computed(() => {
  const products = [...filteredProducts.value]
  if (sortBy.value === 'price-asc') {
    return products.sort((a, b) => productPrice(a) - productPrice(b))
  }
  if (sortBy.value === 'price-desc') {
    return products.sort((a, b) => productPrice(b) - productPrice(a))
  }
  if (sortBy.value === 'name-asc') {
    return products.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (sortBy.value === 'newest') {
    return products.sort((a, b) => parseAppTimestamp(b.created_at).getTime() - parseAppTimestamp(a.created_at).getTime())
  }
  return products.sort((a, b) => Number(b.featured) - Number(a.featured) || b.stock - a.stock || a.name.localeCompare(b.name))
})

const filtersActive = computed(() => selectedPriceRanges.value.length > 0 || selectedOptions.value.length > 0)

const activeCategoryName = computed(() => {
  if (props.activeCategory === null) return 'All Products'
  return store.categories.find((cat) => cat.id === props.activeCategory)?.name ?? 'Products'
})

function selectCategory(id: string | null) {
  emit('update:activeCategory', id)
}

function productPrice(product: Product) {
  return product.on_sale && product.sale_price !== null ? product.sale_price : product.price
}

function clearFilters() {
  selectedPriceRanges.value = []
  selectedOptions.value = []
}
</script>

<style scoped>
.product-grid-enter-active { transition: all 0.2s ease-out; }
.product-grid-leave-active { transition: all 0.15s ease-in; position: absolute; }
.product-grid-enter-from { opacity: 0; transform: translateY(8px); }
.product-grid-leave-to { opacity: 0; }
.filter-sheet-enter-active,
.filter-sheet-leave-active { transition: opacity 0.18s ease; }
.filter-sheet-enter-from,
.filter-sheet-leave-to { opacity: 0; }
</style>
