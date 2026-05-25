<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">Your Products</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Add at least one product to continue</p>
      </div>
      <div class="flex gap-2">
        <label class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl cursor-pointer transition-colors">
          <ArrowUpTrayIcon class="w-4 h-4" />
          Import CSV
          <input type="file" accept=".csv" class="hidden" @change="handleCsvImport" />
        </label>
        <button
          @click="showForm = true"
          class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm shadow-primary/20"
        >
          <PlusIcon class="w-4 h-4" />
          Add Product
        </button>
      </div>
    </div>

    <!-- Add form (inline) -->
    <Transition name="slide">
      <div v-if="showForm" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <PlusCircleIcon class="w-4 h-4 text-primary" />
          {{ editingIdx !== null ? 'Edit Product' : 'New Product' }}
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Product Name *</label>
            <input v-model="newProduct.name" type="text" placeholder="e.g. Chicken Burger" required
              class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Price (KES) *</label>
            <input v-model.number="newProduct.price" type="number" min="0" step="0.01" placeholder="0.00" required
              class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock</label>
            <input v-model.number="newProduct.stock" type="number" min="0" placeholder="999"
              class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <input v-model="newProduct.description" type="text" placeholder="Brief description"
              class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
        </div>
        <div class="flex gap-2 mt-3 justify-end">
          <button @click="cancelForm" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button @click="saveProduct" :disabled="!newProduct.name || !newProduct.price"
            class="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm">
            {{ editingIdx !== null ? 'Update' : 'Add Product' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Products list -->
    <div v-if="localProducts.length" class="space-y-2">
      <div
        v-for="(product, idx) in localProducts"
        :key="idx"
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
      >
        <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
          <CubeIcon class="w-5 h-5 text-gray-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ product.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">KES {{ product.price.toLocaleString() }} · Stock: {{ product.stock ?? '∞' }}</p>
        </div>
        <div class="flex items-center gap-1">
          <button @click="editProduct(idx)" class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
            <PencilIcon class="w-4 h-4" />
          </button>
          <button @click="removeProduct(idx)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!showForm" class="text-center py-8 text-gray-400 dark:text-gray-500">
      <CubeIcon class="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p class="text-sm">No products yet. Add your first product or import from CSV.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PlusIcon, PlusCircleIcon, ArrowUpTrayIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/vue/24/outline'
import type { ProductCreate } from '@qesuite/types'

const props = defineProps<{ products: ProductCreate[] }>()
const emit = defineEmits<{ 'update:products': [products: ProductCreate[]] }>()

const localProducts = ref<ProductCreate[]>([...props.products])
const showForm = ref(false)
const editingIdx = ref<number | null>(null)
const newProduct = ref<ProductCreate>({ name: '', price: 0, stock: 999 })

watch(localProducts, (v) => emit('update:products', v), { deep: true })

function cancelForm() {
  showForm.value = false
  editingIdx.value = null
  newProduct.value = { name: '', price: 0, stock: 999 }
}

function saveProduct() {
  if (!newProduct.value.name || !newProduct.value.price) return
  if (editingIdx.value !== null) {
    localProducts.value[editingIdx.value] = { ...newProduct.value }
  } else {
    localProducts.value.push({ ...newProduct.value })
  }
  cancelForm()
}

function editProduct(idx: number) {
  editingIdx.value = idx
  newProduct.value = { ...localProducts.value[idx] }
  showForm.value = true
}

function removeProduct(idx: number) {
  localProducts.value.splice(idx, 1)
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

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const name = cols[nameIdx]?.trim()
    const price = parseFloat(cols[priceIdx]?.trim() || '0')
    if (!name || !price) continue
    localProducts.value.push({
      name,
      price,
      description: descIdx !== -1 ? cols[descIdx]?.trim() : undefined,
      stock: stockIdx !== -1 ? parseInt(cols[stockIdx]?.trim() || '999') : 999
    })
  }
}
</script>
