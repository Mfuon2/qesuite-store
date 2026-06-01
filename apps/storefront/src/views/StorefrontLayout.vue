<template>
  <div class="storefront-surface min-h-screen bg-white text-slate-950">
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

    <!-- Store inaccessible — blur/lock overlay then redirect to marketplace -->
    <div v-else-if="store.isSuspended" class="relative min-h-screen overflow-hidden">
      <!-- Blurred background: store branding -->
      <div
        class="absolute inset-0 bg-cover bg-center blur-sm scale-105"
        :style="store.config?.tenant.banner_url ? `background-image: url('${store.config.tenant.banner_url}')` : ''"
        :class="!store.config?.tenant.banner_url ? 'bg-gradient-to-br from-slate-200 to-slate-300' : ''"
      />
      <div class="absolute inset-0 bg-white/70 backdrop-blur-sm" />

      <!-- Lock card -->
      <div class="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
          <!-- Store logo blurred -->
          <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow">
            <img
              v-if="store.config?.tenant.logo_url"
              :src="store.config.tenant.logo_url"
              :alt="store.config.tenant.name"
              class="h-full w-full object-cover opacity-40 grayscale"
            />
            <LockClosedIcon v-else class="h-8 w-8 text-slate-400" />
          </div>

          <div class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
            <LockClosedIcon class="h-3.5 w-3.5 text-amber-600" />
            <span class="text-xs font-bold text-amber-700">Store Unavailable</span>
          </div>

          <h1 class="mt-1 text-xl font-extrabold text-slate-950">
            {{ store.config?.tenant.name ?? 'This store' }} is temporarily closed
          </h1>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            This store is not accepting orders right now. You'll be redirected to discover other stores.
          </p>

          <!-- Countdown progress bar -->
          <div class="mt-6">
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-linear"
                :style="{ width: `${redirectProgress}%` }"
              />
            </div>
            <p class="mt-2 text-xs text-slate-400">Redirecting in {{ redirectCountdown }}s…</p>
          </div>

          <button
            class="mt-4 text-sm font-semibold text-emerald-700 underline underline-offset-2"
            @click="goToMarketplace"
          >
            Go now
          </button>
        </div>
      </div>
    </div>

    <!-- Normal layout -->
    <template v-else>
      <StorefrontHeader />
      <main class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <RouterView />
      </main>
      <CartDrawer />
      <StickyCartBar />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { ExclamationCircleIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import { useCartStore } from '@/stores/cart'
import StorefrontHeader from '@/components/StorefrontHeader.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import StickyCartBar from '@/components/StickyCartBar.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const route = useRoute()
const router = useRouter()
const store = useStorefrontStore()
const cartStore = useCartStore()

const slug = computed(() => route.params.slug as string)

// Countdown redirect for suspended/inaccessible stores
const REDIRECT_SECONDS = 4
const redirectCountdown = ref(REDIRECT_SECONDS)
const redirectProgress = ref(0)
let redirectInterval: ReturnType<typeof setInterval> | null = null

function startRedirectCountdown() {
  redirectCountdown.value = REDIRECT_SECONDS
  redirectProgress.value = 0
  redirectInterval = setInterval(() => {
    redirectCountdown.value -= 1
    redirectProgress.value = ((REDIRECT_SECONDS - redirectCountdown.value) / REDIRECT_SECONDS) * 100
    if (redirectCountdown.value <= 0) {
      clearInterval(redirectInterval!)
      goToMarketplace()
    }
  }, 1000)
}

function goToMarketplace() {
  if (redirectInterval) clearInterval(redirectInterval)
  router.replace('/')
}

onUnmounted(() => { if (redirectInterval) clearInterval(redirectInterval) })

onMounted(async () => {
  const s = slug.value
  // Request location immediately — non-blocking, runs in parallel with store load
  store.requestLocation()
  await store.fetchStore(s)
  if (store.isSuspended) {
    startRedirectCountdown()
  } else if (!store.notFound && !store.error) {
    cartStore.initCart(s)
    await Promise.all([store.fetchCategories(), store.fetchProducts()])
  }
})

watch(() => store.isSuspended, (suspended) => {
  if (suspended && !redirectInterval) startRedirectCountdown()
})

watch(slug, async (newSlug) => {
  if (newSlug && newSlug !== store.slug) {
    if (redirectInterval) clearInterval(redirectInterval)
    await store.fetchStore(newSlug)
    if (store.isSuspended) {
      startRedirectCountdown()
    } else if (!store.notFound && !store.error) {
      cartStore.initCart(newSlug)
      await Promise.all([store.fetchCategories(), store.fetchProducts()])
    }
  }
})
</script>
