<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="qs-card-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[30px] bg-white animate-bounce-in">
      <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Catalog item</p>
          <h3 class="mt-1 text-xl font-bold text-slate-950">
            {{ product ? 'Edit product' : 'Add product' }}
          </h3>
        </div>
        <button @click="emit('close')" class="owner-icon-button h-10 w-10">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5 p-5">
        <div>
          <label class="admin-label">Product image</label>
          <ImageUpload
            ref="imageRef"
            :model-value="form.image_url"
            @file-selected="handleImageSelected"
          />
        </div>

        <div>
          <label class="admin-label">Name *</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Product name"
            required
            class="owner-input"
          />
        </div>

        <div>
          <label class="admin-label">Description</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Brief product description"
            class="owner-input resize-none"
          />
        </div>

        <div>
          <label class="admin-label">Category</label>
          <div class="flex gap-2">
            <select
              v-model="form.category_id"
              class="owner-select flex-1"
            >
              <option value="">No category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="admin-label">Price (KES) *</label>
            <input
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              class="owner-input"
            />
          </div>
          <div>
            <label class="admin-label">Sale price (KES)</label>
            <input
              v-model.number="form.sale_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              class="owner-input"
            />
          </div>
        </div>

        <div>
          <label class="admin-label">Stock</label>
          <input
            v-model.number="form.stock"
            type="number"
            min="0"
            placeholder="999"
            class="owner-input"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <button type="button" @click="form.featured = !form.featured"
              :class="['qs-toggle', form.featured ? 'bg-primary' : 'bg-slate-200']">
              <span :class="['qs-toggle-thumb', form.featured ? 'translate-x-5' : 'translate-x-0.5']" />
            </button>
            <span class="text-sm font-bold text-slate-700">Featured</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer select-none">
            <button type="button" @click="form.on_sale = !form.on_sale"
              :class="['qs-toggle', form.on_sale ? 'bg-primary' : 'bg-slate-200']">
              <span :class="['qs-toggle-thumb', form.on_sale ? 'translate-x-5' : 'translate-x-0.5']" />
            </button>
            <span class="text-sm font-bold text-slate-700">On sale</span>
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" @click="emit('close')" class="owner-secondary-action flex-1">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving || uploading"
            class="owner-primary-action flex-1"
          >
            <svg v-if="saving || uploading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ uploading ? 'Uploading image...' : saving ? (product ? 'Saving...' : 'Adding...') : (product ? 'Save Changes' : 'Add Product') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import ImageUpload from './ImageUpload.vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import type { Product, ProductCreate, ProductUpdate } from '@qesuite/types'

const props = defineProps<{ product?: Product | null }>()
const emit = defineEmits<{
  close: []
  saved: [product: Product]
}>()

const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()
const imageRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const saving = ref(false)
const uploading = ref(false)
const categories = ref(categoriesStore.categories)

const form = reactive({
  name: props.product?.name || '',
  description: props.product?.description || '',
  category_id: props.product?.category_id || '',
  price: props.product?.price || 0,
  sale_price: props.product?.sale_price || null as number | null,
  stock: props.product?.stock ?? 999,
  image_url: props.product?.image_url || '',
  featured: props.product?.featured || false,
  on_sale: props.product?.on_sale || false
})

async function handleImageSelected(file: File) {
  if (!imageRef.value) return
  uploading.value = true
  try {
    const url = await productsStore.uploadImage(file, (pct) => imageRef.value?.setProgress(pct))
    if (url) {
      form.image_url = url
      imageRef.value.setPreview(url)
    }
  } finally {
    uploading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    let result: Product | null = null
    if (props.product) {
      const payload: ProductUpdate = {
        name: form.name,
        description: form.description || null,
        category_id: form.category_id || null,
        price: form.price,
        sale_price: form.on_sale && form.sale_price ? form.sale_price : null,
        stock: form.stock,
        image_url: form.image_url || null,
        featured: form.featured,
        on_sale: form.on_sale
      }
      result = await productsStore.updateProduct(props.product.id, payload)
    } else {
      const payload: ProductCreate = {
        name: form.name,
        description: form.description || undefined,
        category_id: form.category_id || undefined,
        price: form.price,
        sale_price: form.on_sale && form.sale_price ? form.sale_price : undefined,
        stock: form.stock,
        image_url: form.image_url || undefined,
        featured: form.featured,
        on_sale: form.on_sale
      }
      result = await productsStore.createProduct(payload)
    }

    if (result) {
      emit('saved', result)
      emit('close')
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!categoriesStore.categories.length) await categoriesStore.fetchCategories()
  categories.value = categoriesStore.categories
})
</script>
