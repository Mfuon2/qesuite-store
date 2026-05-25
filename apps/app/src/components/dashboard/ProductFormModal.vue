<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-bounce-in">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ product ? 'Edit Product' : 'Add Product' }}
        </h3>
        <button @click="emit('close')" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <!-- Image -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Image</label>
          <ImageUpload
            ref="imageRef"
            :model-value="form.image_url"
            @file-selected="handleImageSelected"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Product name"
            required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Brief product description"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <div class="flex gap-2">
            <select
              v-model="form.category_id"
              class="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              <option value="">No category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (KES) *</label>
            <input
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sale Price (KES)</label>
            <input
              v-model.number="form.sale_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock</label>
          <input
            v-model.number="form.stock"
            type="number"
            min="0"
            placeholder="999"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <button type="button" @click="form.featured = !form.featured"
              :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors', form.featured ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600']">
              <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', form.featured ? 'translate-x-[18px]' : 'translate-x-0.5']" />
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300">Featured</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer select-none">
            <button type="button" @click="form.on_sale = !form.on_sale"
              :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors', form.on_sale ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600']">
              <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', form.on_sale ? 'translate-x-[18px]' : 'translate-x-0.5']" />
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300">On Sale</span>
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" @click="emit('close')" class="flex-1 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ product ? 'Save Changes' : 'Add Product' }}
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
import type { Product } from '@qesuite/types'

const props = defineProps<{ product?: Product | null }>()
const emit = defineEmits<{
  close: []
  saved: [product: Product]
}>()

const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()
const imageRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const saving = ref(false)
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
  const url = await productsStore.uploadImage(file, (pct) => imageRef.value?.setProgress(pct))
  if (url) {
    form.image_url = url
    imageRef.value.setPreview(url)
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    const payload = {
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

    let result: Product | null = null
    if (props.product) {
      result = await productsStore.updateProduct(props.product.id, payload)
    } else {
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
