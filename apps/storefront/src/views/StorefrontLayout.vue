<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Loading skeleton -->
    <template v-if="store.loading">
      <div class="bg-white dark:bg-gray-900 h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 gap-3">
        <div class="skeleton w-9 h-9 rounded-xl" />
        <div class="skeleton h-5 w-32 rounded" />
        <div class="ml-auto skeleton h-9 w-24 rounded-xl" />
      </div>
      <div class="skeleton w-full h-48 sm:h-64" />
      <div class="px-4 py-8 max-w-5xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <SkeletonCard v-for="i in 8" :key="i" />
        </div>
      </div>
    </template>

    <!-- Store not found -->
    <div
      v-else-if="store.notFound"
      class="min-h-screen flex flex-col items-center justify-center text-center p-6"
    >
      <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <ExclamationCircleIcon class="w-10 h-10 text-gray-400" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('errors.store_not_found') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xs">
        {{ $t('errors.store_not_found_hint') }}
      </p>
    </div>

    <!-- Store error -->
    <div
      v-else-if="store.error"
      class="min-h-screen flex flex-col items-center justify-center text-center p-6"
    >
      <div class="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <ExclamationCircleIcon class="w-10 h-10 text-red-400" />
      </div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('errors.generic') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mb-5">{{ store.error }}</p>
      <button
        class="text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-95"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click="store.fetchStore(slug)"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Store suspended -->
    <div
      v-else-if="store.isSuspended"
      class="min-h-screen flex flex-col items-center justify-center text-center p-6"
    >
      <div class="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
        <LockClosedIcon class="w-10 h-10 text-amber-400" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('errors.store_suspended') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xs">
        {{ $t('errors.store_suspended_hint') }}
      </p>
      <a
        v-if="store.whatsappNumber"
        :href="`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, '')}`"
        target="_blank"
        class="mt-5 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
      >
        {{ $t('footer.whatsapp') }}
      </a>
    </div>

    <!-- Normal layout -->
    <template v-else>
      <StorefrontHeader />
      <main class="max-w-5xl mx-auto">
        <RouterView />
      </main>
      <CartDrawer />
      <StickyCartBar />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { ExclamationCircleIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import { useCartStore } from '@/stores/cart'
import StorefrontHeader from '@/components/StorefrontHeader.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import StickyCartBar from '@/components/StickyCartBar.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const route = useRoute()
const store = useStorefrontStore()
const cartStore = useCartStore()

const slug = computed(() => route.params.slug as string)

onMounted(async () => {
  const s = slug.value
  await store.fetchStore(s)
  if (!store.notFound && !store.error) {
    cartStore.initCart(s)
    await Promise.all([store.fetchCategories(), store.fetchProducts()])
  }
})

watch(slug, async (newSlug) => {
  if (newSlug && newSlug !== store.slug) {
    await store.fetchStore(newSlug)
    if (!store.notFound && !store.error) {
      cartStore.initCart(newSlug)
      await Promise.all([store.fetchCategories(), store.fetchProducts()])
    }
  }
})
</script>
