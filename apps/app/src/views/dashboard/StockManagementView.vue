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

    <section class="owner-toolbar">
      <div class="owner-segmented" aria-label="Section">
        <button
          v-for="opt in tabOptions"
          :key="opt.value"
          @click="activeTab = opt.value"
          :class="['owner-segment-button', activeTab === opt.value ? 'owner-segment-button-active' : '']"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <template v-if="activeTab === 'adjust'">
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
            <p class="text-xs font-medium text-slate-500">Stock value (at cost)</p>
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
                product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock < lowStockThreshold(product) ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'
              ]"
            >
              {{ product.stock === 0 ? 'Out of stock' : product.stock < lowStockThreshold(product) ? 'Low stock' : 'In stock' }}
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
    </template>

    <!-- Stock movement ledger -->
    <template v-else-if="activeTab === 'movements'">
      <section class="mt-3">
        <div v-if="stockStore.loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="skeleton h-12 rounded-xl" />
        </div>
        <div v-else-if="!stockStore.movements.length" class="owner-empty">
          <ClockIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p class="text-base font-bold text-slate-800">No stock movements yet</p>
          <p class="mt-1 text-sm text-slate-500">Receipts, adjustments, and corrections will show up here.</p>
        </div>
        <div v-else class="owner-panel space-y-1.5 !p-1.5">
          <div v-for="m in stockStore.movements" :key="m.id" class="owner-list-row flex items-center gap-3">
            <div :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1', m.quantity_delta >= 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-red-50 text-red-700 ring-red-100']">
              <ArrowUpIcon v-if="m.quantity_delta >= 0" class="h-4 w-4" />
              <ArrowDownIcon v-else class="h-4 w-4" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-950">{{ m.product_name }}</p>
              <p class="truncate text-xs font-medium text-slate-400">{{ movementTypeLabel(m.type) }}{{ m.reason ? ` — ${m.reason}` : '' }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p :class="['text-sm font-black', m.quantity_delta >= 0 ? 'text-emerald-600' : 'text-red-600']">{{ m.quantity_delta >= 0 ? '+' : '' }}{{ m.quantity_delta }}</p>
              <p class="text-xs font-medium text-slate-400">now {{ m.resulting_stock }}</p>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Stock-take sessions -->
    <template v-else>
      <section v-if="!stockStore.activeSession" class="owner-panel mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p class="text-sm font-bold text-slate-950">No stock-take in progress</p>
          <p class="mt-0.5 text-xs text-slate-500">Opening one snapshots every active product's current count.</p>
        </div>
        <button v-if="accessStore.can('stock.take')" type="button" class="owner-primary-action" @click="stockStore.openSession()">
          <PlusIcon class="h-4 w-4" /> Start stock-take
        </button>
      </section>

      <section v-else class="mt-3 space-y-3">
        <div class="owner-panel-header owner-panel !mb-0">
          <div>
            <h2 class="owner-section-title">Counting in progress</h2>
            <p class="owner-section-copy">Enter the counted quantity for each product. A reason is required if it doesn't match.</p>
          </div>
          <button v-if="accessStore.can('stock.take')" type="button" class="owner-primary-action" :disabled="stockStore.saving" @click="closeActiveSession">
            Close stock-take
          </button>
        </div>

        <div class="owner-panel space-y-1.5 !p-1.5">
          <div v-for="line in stockStore.activeSession.lines" :key="line.id" class="owner-list-row flex flex-wrap items-center gap-2">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-950">{{ line.product_name }}</p>
              <p class="text-xs font-medium text-slate-400">Expected {{ line.expected_quantity }} {{ line.unit_of_measure }}</p>
            </div>
            <input
              type="number" min="0" placeholder="Count"
              v-model.number="countDrafts[line.product_id]"
              class="owner-input !min-h-8 w-20 !rounded-lg !py-1 text-center !text-xs"
            />
            <input
              v-if="countDrafts[line.product_id] !== undefined && countDrafts[line.product_id] !== line.expected_quantity"
              type="text" placeholder="Reason for mismatch" v-model="reasonDrafts[line.product_id]"
              class="owner-input !min-h-8 min-w-0 flex-1 !rounded-lg !py-1 !text-xs"
            />
            <span v-if="line.counted_quantity !== null" class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Saved: {{ line.counted_quantity }}</span>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="button" class="owner-primary-action" :disabled="!pendingCounts.length || stockStore.saving" @click="saveCounts">
            {{ stockStore.saving ? 'Saving…' : `Save ${pendingCounts.length || ''} count(s)` }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  ArchiveBoxIcon, ExclamationTriangleIcon, NoSymbolIcon, BanknotesIcon,
  MagnifyingGlassIcon, CubeIcon, MinusIcon, PlusIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon,
} from '@heroicons/vue/24/outline'
import { useProductsStore } from '@/stores/products'
import { useStockStore } from '@/stores/stock'
import { useAccessStore } from '@/stores/access'
import { useToast } from '@/composables/useToast'
import type { Product, StockMovementType } from '@qesuite/types'

// Fallback for products that haven't had a reorder level configured yet —
// once set, a product's own reorder_level takes over as its threshold.
const LOW_STOCK_THRESHOLD = 5

function lowStockThreshold(product: Product): number {
  return product.reorder_level > 0 ? product.reorder_level : LOW_STOCK_THRESHOLD
}

const productsStore = useProductsStore()
const stockStore = useStockStore()
const accessStore = useAccessStore()
const { showToast } = useToast()

const activeTab = ref<'adjust' | 'movements' | 'take'>('adjust')
const tabOptions = [
  { value: 'adjust' as const, label: 'Quick Adjust' },
  { value: 'movements' as const, label: 'Movements' },
  { value: 'take' as const, label: 'Stock-Take' },
]

const search = ref('')
const sortBy = ref<'stock-asc' | 'name'>('stock-asc')
const savingId = ref<string | null>(null)

const sortOptions = [
  { value: 'stock-asc' as const, label: 'Lowest stock first' },
  { value: 'name' as const, label: 'Name' },
]

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  purchase_receipt: 'Purchase receipt', sale: 'Sale', order_sale: 'Order sale', adjustment: 'Adjustment',
  transfer_in: 'Transfer in', transfer_out: 'Transfer out', damaged: 'Damaged', expired: 'Expired',
  count_correction: 'Stock-take correction', initial: 'Initial stock',
}
const movementTypeLabel = (t: StockMovementType) => MOVEMENT_TYPE_LABELS[t] ?? t

const countDrafts = reactive<Record<string, number>>({})
const reasonDrafts = reactive<Record<string, string>>({})

const pendingCounts = computed(() => {
  if (!stockStore.activeSession) return []
  return (stockStore.activeSession.lines || [])
    .filter(line => countDrafts[line.product_id] !== undefined && countDrafts[line.product_id] !== line.counted_quantity)
    .map(line => ({ product_id: line.product_id, counted_quantity: countDrafts[line.product_id], reason: reasonDrafts[line.product_id] }))
})

async function saveCounts() {
  if (!stockStore.activeSession || !pendingCounts.value.length) return
  const missingReason = pendingCounts.value.find(c => c.counted_quantity !== stockStore.activeSession!.lines!.find(l => l.product_id === c.product_id)!.expected_quantity && !c.reason?.trim())
  if (missingReason) { showToast('Add a reason for every count that does not match the expected quantity', 'error'); return }
  await stockStore.recordCounts(stockStore.activeSession.id, pendingCounts.value)
}

async function closeActiveSession() {
  if (!stockStore.activeSession) return
  await stockStore.closeSession(stockStore.activeSession.id)
}

watch(activeTab, (tab) => {
  if (tab === 'movements' && !stockStore.movements.length) stockStore.fetchMovements()
  if (tab === 'take' && !stockStore.sessions.length) stockStore.fetchSessions()
})

const canEditStock = computed(() => accessStore.can('products.edit'))

const lowStockCount = computed(() =>
  productsStore.products.filter(p => p.stock > 0 && p.stock < lowStockThreshold(p)).length
)
const outOfStockCount = computed(() => productsStore.products.filter(p => p.stock === 0).length)
// Inventory asset value is a cost-basis figure (what was paid for stock on
// hand), not its retail/selling value — that's what Cost of Goods Sold
// (COGS)/margin reporting needs it to mean.
const stockValue = computed(() =>
  productsStore.products.reduce((sum, p) => sum + p.stock * (p.cost_price ?? 0), 0)
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
