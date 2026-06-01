<template>
  <article
    class="qs-card qs-card-interactive overflow-hidden"
    :class="{ 'opacity-60': isOutOfStock }"
  >
    <!-- Image container -->
    <div class="relative aspect-square overflow-hidden bg-gradient-to-br from-emerald-50 to-white sm:aspect-[4/3]">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
        decoding="async"
        @error="imgError = true"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
      >
        <PhotoIcon class="h-10 w-10 text-slate-300" />
      </div>

      <button
        v-if="!isOutOfStock && quantity === 0"
        class="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.10)] transition active:scale-95 sm:hidden"
        @click.prevent="handleAdd"
        aria-label="Add to cart"
      >
        <PlusIcon class="h-5 w-5" />
      </button>

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
    <div class="p-2.5 sm:p-3">
      <h3 class="mb-1 text-xs font-extrabold leading-snug text-slate-950 line-clamp-2 sm:text-sm">
        {{ product.name }}
      </h3>
      <p v-if="product.description" class="mb-2 truncate text-[11px] font-medium text-slate-500 sm:text-xs">
        {{ product.description }}
      </p>

      <!-- Price -->
      <div class="mb-2 flex items-center gap-1.5 flex-wrap">
        <span
          class="text-sm font-extrabold sm:text-base"
          :style="{ color: 'var(--color-primary)' }"
        >
          {{ displayPrice }}
        </span>
        <span
          v-if="product.on_sale && product.sale_price !== null"
          class="text-[11px] text-slate-400 line-through sm:text-xs"
        >
          {{ formatPrice(product.price) }}
        </span>
        <span
          v-if="product.on_sale && product.sale_price !== null"
          class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white"
        >
          -{{ discountPct }}%
        </span>
      </div>

      <!-- Add to Cart / Quantity Selector -->
      <div v-if="isOutOfStock" class="h-9" />

      <!-- Quantity selector when in cart -->
      <div
        v-else-if="quantity > 0"
        class="flex h-8 items-center justify-between overflow-hidden rounded-xl bg-slate-50 sm:h-9"
      >
        <button
          class="flex h-8 w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 active:scale-90 sm:h-9 sm:w-9"
          @click.prevent="decrement(product.id)"
        >
          <MinusIcon class="w-4 h-4" />
        </button>
        <span class="min-w-[24px] text-center text-xs font-bold text-slate-950 sm:text-sm">
          {{ quantity }}
        </span>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-r-xl text-white transition-colors active:scale-90 sm:h-9 sm:w-9"
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
        class="hidden h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-white text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-50 active:scale-95 sm:flex"
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
const discountPct = computed(() => {
  if (!props.product.on_sale || props.product.sale_price === null) return 0
  return Math.round((1 - props.product.sale_price / props.product.price) * 100)
})
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
