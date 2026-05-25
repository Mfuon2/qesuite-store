<template>
  <div>
    <!-- Hero Banner -->
    <HeroBanner @shop-now="scrollToProducts" />

    <!-- Category Tabs -->
    <CategoryTabs
      :categories="store.categories"
      :active-category="activeCategory"
      @update:active-category="handleCategoryChange"
    />

    <!-- Featured strip (only when on 'all' tab) -->
    <FeaturedStrip v-if="activeCategory === null" />

    <!-- Products grid -->
    <div ref="productsSection" id="products">
      <ProductGrid :active-category="activeCategory" />
    </div>

    <!-- Footer -->
    <StorefrontFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useStorefrontStore } from '@/stores/store'
import HeroBanner from '@/components/HeroBanner.vue'
import CategoryTabs from '@/components/CategoryTabs.vue'
import FeaturedStrip from '@/components/FeaturedStrip.vue'
import ProductGrid from '@/components/ProductGrid.vue'
import StorefrontFooter from '@/components/StorefrontFooter.vue'

const store = useStorefrontStore()
const activeCategory = ref<string | null>(null)
const productsSection = ref<HTMLElement | null>(null)

function handleCategoryChange(id: string | null) {
  activeCategory.value = id
  store.fetchProducts(id ?? undefined)
}

function scrollToProducts() {
  nextTick(() => {
    productsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
</script>
