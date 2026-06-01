<template>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-base font-extrabold text-slate-950">Products</h3>
          <p class="text-sm font-medium text-slate-500">{{ localProducts.length }} item{{ localProducts.length === 1 ? '' : 's' }} ready for launch</p>
        </div>
        <div class="flex gap-2">
          <label class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 text-sm font-extrabold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition hover:bg-emerald-50">
            <ArrowUpTrayIcon class="h-4 w-4" />
            Import CSV
            <input type="file" accept=".csv" class="hidden" @change="handleCsvImport" />
          </label>
          <button
            @click="showForm = true"
            class="inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-700 px-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(20,132,71,0.20)] transition hover:bg-emerald-800"
          >
            <PlusIcon class="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <Transition name="slide">
        <div v-if="showForm" class="qs-card-soft border-emerald-100 bg-emerald-50/40 p-4">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="flex items-center gap-2 text-sm font-extrabold text-slate-950">
              <PlusCircleIcon class="h-4 w-4 text-emerald-700" />
              {{ editingIdx !== null ? 'Edit Product' : 'New Product' }}
            </h4>
            <button class="text-sm font-bold text-slate-500" @click="cancelForm">Cancel</button>
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <div class="row-span-4">
              <label class="admin-label">Product Image</label>
              <ImageUpload
                ref="imageUploadRef"
                :model-value="newProduct.image_url"
                :disabled="imageUploading"
                class="h-[148px]"
                @file-selected="handleProductImage"
              />
            </div>
            <div>
              <label class="admin-label">Product Name *</label>
              <input v-model="newProduct.name" type="text" placeholder="e.g. Chicken Burger" required class="admin-input bg-white" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="admin-label">Price (KES) *</label>
                <input v-model.number="newProduct.price" type="number" min="0" step="0.01" placeholder="0.00" required class="admin-input bg-white" />
              </div>
              <div>
                <label class="admin-label">Stock</label>
                <input v-model.number="newProduct.stock" type="number" min="0" placeholder="999" class="admin-input bg-white" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="admin-label">
                  Sale Price (KES)
                  <span class="ml-1 font-medium text-slate-400">optional</span>
                </label>
                <input
                  v-model.number="newProduct.sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty for no discount"
                  class="admin-input bg-white"
                  :class="{ 'border-orange-400': newProduct.sale_price && newProduct.sale_price >= newProduct.price }"
                />
                <p v-if="newProduct.sale_price && newProduct.sale_price >= newProduct.price" class="mt-0.5 text-xs font-semibold text-orange-500">
                  Sale price must be less than regular price
                </p>
                <p v-else-if="newProduct.sale_price && newProduct.price > 0" class="mt-0.5 text-xs font-semibold text-emerald-700">
                  Save KES {{ (newProduct.price - newProduct.sale_price).toLocaleString() }}
                  ({{ Math.round((1 - newProduct.sale_price / newProduct.price) * 100) }}% off)
                </p>
              </div>
              <div>
                <label class="admin-label">Description</label>
                <input v-model="newProduct.description" type="text" placeholder="Brief description" class="admin-input bg-white" />
              </div>
            </div>
          </div>

          <div class="mt-3 flex justify-end gap-2">
            <button @click="cancelForm" class="h-10 rounded-xl border border-slate-100 bg-white px-4 text-sm font-extrabold text-slate-600">
              Cancel
            </button>
            <button
              @click="saveProduct"
              :disabled="!newProduct.name || !newProduct.price"
              class="h-10 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(20,132,71,0.18)] disabled:opacity-60"
            >
              {{ editingIdx !== null ? 'Update' : 'Add Product' }}
            </button>
          </div>
        </div>
      </Transition>

      <div v-if="localProducts.length" class="grid gap-2">
        <div
          v-for="(product, idx) in localProducts"
          :key="idx"
          class="qs-card qs-card-interactive flex items-center gap-3 p-3"
        >
          <div class="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
            <div v-else class="grid h-full w-full place-items-center text-emerald-700">
              <CubeIcon class="h-5 w-5" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate text-sm font-extrabold text-slate-950">{{ product.name }}</p>
              <span
                v-if="product.sale_price && product.sale_price < product.price"
                class="shrink-0 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white"
              >
                {{ Math.round((1 - product.sale_price / product.price) * 100) }}% OFF
              </span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="product.sale_price && product.sale_price < product.price">
                <span class="text-xs font-extrabold text-emerald-700">KES {{ product.sale_price.toLocaleString() }}</span>
                <span class="text-xs font-semibold text-slate-400 line-through">KES {{ product.price.toLocaleString() }}</span>
              </template>
              <template v-else>
                <span class="text-xs font-semibold text-slate-500">KES {{ product.price.toLocaleString() }}</span>
              </template>
              <span class="text-xs font-semibold text-slate-400">· Stock: {{ product.stock ?? 'unlimited' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button @click="editProduct(idx)" class="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700">
              <PencilIcon class="h-4 w-4" />
            </button>
            <button @click="removeProduct(idx)" class="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500">
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!showForm" class="qs-card-soft flex flex-col items-center justify-center border-dashed py-12 text-center">
        <CubeIcon class="mb-3 h-10 w-10 text-slate-300" />
        <p class="text-sm font-extrabold text-slate-700">No products yet</p>
        <p class="mt-1 text-sm font-medium text-slate-500">Add a product or import a CSV to continue.</p>
      </div>
    </div>

    <aside class="qs-card-soft h-fit p-4">
      <h4 class="text-sm font-extrabold text-slate-950">Catalog checklist</h4>
      <div class="mt-3 space-y-3">
        <div class="flex items-center gap-3">
          <span class="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <CubeIcon class="h-4 w-4" />
          </span>
          <div>
            <p class="text-sm font-bold text-slate-700">At least one item</p>
            <p class="text-xs font-medium text-slate-500">{{ localProducts.length ? 'Complete' : 'Required' }}</p>
          </div>
        </div>
        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">CSV columns</p>
          <p class="mt-1 text-sm font-semibold text-slate-600">name, price, description, stock</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PlusIcon, PlusCircleIcon, ArrowUpTrayIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/vue/24/outline'
import ImageUpload from '@/components/dashboard/ImageUpload.vue'
import { apiGetUploadUrl } from '@/api/settings'
import { beginNetworkActivity, endNetworkActivity } from '@/composables/useNetworkActivity'
import type { ProductCreate } from '@qesuite/types'

const props = defineProps<{ products: ProductCreate[] }>()
const emit = defineEmits<{ 'update:products': [products: ProductCreate[]] }>()

const localProducts = ref<ProductCreate[]>([...props.products])
const showForm = ref(false)
const editingIdx = ref<number | null>(null)
const newProduct = ref<ProductCreate>({ name: '', price: 0, stock: 999, image_url: undefined, sale_price: undefined })
const imageUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const imageUploading = ref(false)

watch(localProducts, (v) => emit('update:products', v), { deep: true })

function cancelForm() {
  showForm.value = false
  editingIdx.value = null
  newProduct.value = { name: '', price: 0, stock: 999, image_url: undefined, sale_price: undefined }
  imageUploadRef.value?.reset()
}

async function handleProductImage(file: File) {
  if (!imageUploadRef.value) return
  imageUploading.value = true
  const activity = beginNetworkActivity('Uploading product image')
  try {
    const presign = await apiGetUploadUrl(file.name, file.type)
    if (!presign.success || !presign.data) return
    const { upload_url, public_url } = presign.data

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) imageUploadRef.value?.setProgress(Math.round(e.loaded / e.total * 100))
      })
      xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject())
      xhr.addEventListener('error', reject)
      xhr.open('PUT', upload_url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    imageUploadRef.value.setPreview(public_url)
    newProduct.value.image_url = public_url
  } catch {
    // upload failed silently — image_url stays undefined
  } finally {
    imageUploading.value = false
    endNetworkActivity(activity)
  }
}

function saveProduct() {
  if (!newProduct.value.name || !newProduct.value.price) return
  const product = { ...newProduct.value }
  // Clear invalid sale prices
  if (!product.sale_price || product.sale_price <= 0 || product.sale_price >= product.price) {
    product.sale_price = undefined
  }
  if (editingIdx.value !== null) {
    localProducts.value[editingIdx.value] = product
  } else {
    localProducts.value.push(product)
  }
  cancelForm()
}

function editProduct(idx: number) {
  editingIdx.value = idx
  newProduct.value = { ...localProducts.value[idx] }
  showForm.value = true
  // If product has an image, prime the preview in the upload widget
  if (localProducts.value[idx].image_url) {
    setTimeout(() => imageUploadRef.value?.setPreview(localProducts.value[idx].image_url!), 50)
  } else {
    setTimeout(() => imageUploadRef.value?.reset(), 50)
  }
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
