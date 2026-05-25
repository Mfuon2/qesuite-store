<template>
  <article
    class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    :class="{ 'opacity-60': isOutOfStock }"
  >
    <!-- Image container -->
    <div class="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
        @error="imgError = true"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <PhotoIcon class="w-12 h-12 text-gray-300 dark:text-gray-600" />
      </div>

      <!-- SALE badge -->
      <span
        v-if="product.on_sale && product.sale_price !== null"
        class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
      >
        {{ $t('product.sale') }}
      </span>

      <!-- Out of stock overlay -->
      <div
        v-if="isOutOfStock"
        class="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center"
      >
        <span class="bg-gray-800/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          {{ $t('product.out_of_stock') }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-3">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5">
        {{ product.name }}
      </h3>

      <!-- Price -->
      <div class="flex items-center gap-1.5 mb-2">
        <span
          class="text-base font-bold"
          :style="{ color: 'var(--color-primary)' }"
        >
          {{ displayPrice }}
        </span>
        <span
          v-if="product.on_sale && product.sale_price !== null"
          class="text-xs text-gray-400 dark:text-gray-500 line-through"
        >
          {{ formatPrice(product.price) }}
        </span>
      </div>

      <!-- Add to Cart / Quantity Selector -->
      <div v-if="isOutOfStock" class="h-9" />

      <!-- Quantity selector when in cart -->
      <div
        v-else-if="quantity > 0"
        class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden h-9"
      >
        <button
          class="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors active:scale-90"
          @click.prevent="decrement(product.id)"
        >
          <MinusIcon class="w-4 h-4" />
        </button>
        <span class="font-semibold text-sm text-gray-900 dark:text-white min-w-[24px] text-center">
          {{ quantity }}
        </span>
        <button
          class="w-9 h-9 flex items-center justify-center text-white transition-colors active:scale-90 rounded-r-xl"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          :disabled="quantity >= product.stock"
          @click.prevent="increment(product.id)"
        >
          <PlusIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Add to cart button -->
      <button
        v-else
        class="w-full h-9 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click.prevent="handleAdd"
      >
        <PlusIcon class="w-4 h-4" />
        {{ $t('product.add_to_cart') }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhotoIcon, PlusIcon, MinusIcon } from '@heroicons/vue/24/outline'
import type { Product } from '@qesuite/types'
import { useCart } from '@/composables/useCart'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ product: Product }>()
const { t } = useI18n()
const toast = useToast()
const { formatPrice, addToCart, increment, decrement, getQuantity } = useCart()

const imgError = ref(false)

const isOutOfStock = computed(() => !props.product.is_active || props.product.stock <= 0)
const quantity = computed(() => getQuantity(props.product.id))
const displayPrice = computed(() => {
  if (props.product.on_sale && props.product.sale_price !== null) {
    return formatPrice(props.product.sale_price)
  }
  return formatPrice(props.product.price)
})

function handleAdd() {
  if (isOutOfStock.value) {
    toast.error(t('errors.out_of_stock'))
    return
  }
  addToCart(props.product)
  toast.success(`${props.product.name} added to cart`)
}
</script>
