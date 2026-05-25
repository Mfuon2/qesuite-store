<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center bg-gray-50">
    <div class="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
      <ShoppingBagIcon class="w-8 h-8 text-emerald-500" />
    </div>
    <h1 class="text-xl font-bold text-gray-900 mb-1">
      {{ isRoot ? 'Welcome to QeSuite' : 'Store not found' }}
    </h1>
    <p class="text-gray-500 text-sm mb-6 max-w-xs">
      {{ isRoot
        ? 'Visit a store by adding its slug to the URL.'
        : "This store doesn't exist or may have been removed." }}
    </p>
    <div v-if="isRoot" class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 shadow-sm">
      <span class="text-gray-400">e.g.</span>
      <code class="text-emerald-600 font-mono">{{ origin }}/<strong>your-store</strong></code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const isRoot = computed(() => route.path === '/')
const origin = window.location.origin
</script>
