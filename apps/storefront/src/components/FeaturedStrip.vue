<template>
  <section v-if="featuredProducts.length > 0" class="py-4">
    <div class="px-4 flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <SparklesIcon class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" />
        <h2 class="text-base font-bold text-gray-900 ">
          {{ $t('product.featured') }}
        </h2>
      </div>
    </div>
    <div
      class="flex gap-3 overflow-x-auto pb-2 px-4"
      style="scrollbar-width: none; -ms-overflow-style: none;"
    >
      <div
        v-for="product in featuredProducts"
        :key="product.id"
        class="flex-shrink-0 w-40 sm:w-48"
      >
        <ProductCard :product="product" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SparklesIcon } from '@heroicons/vue/24/solid'
import { useStorefrontStore } from '@/stores/store'
import ProductCard from './ProductCard.vue'

const store = useStorefrontStore()
const featuredProducts = computed(() => store.featuredProducts)
</script>
