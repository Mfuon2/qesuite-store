<template>
  <section class="px-4 py-4">
    <!-- Skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <SkeletonCard v-for="i in 8" :key="i" />
      </div>
    </template>

    <!-- Products -->
    <template v-else-if="filteredProducts.length > 0">
      <TransitionGroup
        name="product-grid"
        tag="div"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
        />
      </TransitionGroup>
    </template>

    <!-- Empty state -->
    <template v-else>
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ShoppingBagIcon class="w-10 h-10 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('product.no_products') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('product.no_products_hint') }}
        </p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import ProductCard from './ProductCard.vue'
import SkeletonCard from './SkeletonCard.vue'

const props = defineProps<{
  activeCategory: string | null
}>()

const store = useStorefrontStore()

const loading = computed(() => store.productsLoading)

const filteredProducts = computed(() => {
  if (props.activeCategory === null) {
    return store.activeProducts
  }
  return store.activeProducts.filter(
    (p) => p.category_id === props.activeCategory
  )
})
</script>

<style scoped>
.product-grid-enter-active { transition: all 0.2s ease-out; }
.product-grid-leave-active { transition: all 0.15s ease-in; position: absolute; }
.product-grid-enter-from { opacity: 0; transform: translateY(8px); }
.product-grid-leave-to { opacity: 0; }
</style>
