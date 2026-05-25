<template>
  <section class="relative overflow-hidden">
    <!-- Skeleton -->
    <template v-if="loading">
      <div class="skeleton w-full h-48 sm:h-64" />
    </template>

    <!-- Banner Image -->
    <template v-else>
      <div
        class="relative w-full h-36 sm:h-48 bg-gradient-to-br from-emerald-600 to-teal-700 overflow-hidden"
      >
        <img
          v-if="bannerUrl"
          :src="bannerUrl"
          :alt="storeName"
          class="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchpriority="high"
        />
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <!-- Content -->
        <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <h1 class="text-xl sm:text-2xl font-bold text-white drop-shadow-sm leading-tight">
            {{ storeName }}
          </h1>
          <p v-if="tagline" class="text-white/80 text-xs sm:text-sm mt-0.5 mb-2">
            {{ tagline }}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <button
              class="bg-white text-gray-900 font-semibold text-xs px-4 py-1.5 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
              @click="$emit('shop-now')"
            >
              Shop Now
            </button>
            <div
              v-if="deliveryEnabled"
              class="flex items-center gap-1 text-white/90 text-xs font-medium"
            >
              <TruckIcon class="w-3.5 h-3.5" />
              <span>{{ estimatedMinutes }} min</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TruckIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'

defineEmits<{ 'shop-now': [] }>()

const store = useStorefrontStore()
const loading = computed(() => store.loading)
const storeName = computed(() => store.storeName)
const bannerUrl = computed(() => store.config?.tenant.banner_url)
const estimatedMinutes = computed(() => store.estimatedMinutes)
const deliveryEnabled = computed(() => store.deliveryEnabled)

// Could come from store settings / tenant in future
const tagline = computed(() => null)
</script>
