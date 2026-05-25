<template>
  <header
    class="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm"
  >
    <div class="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
      <!-- Logo + Store Name -->
      <RouterLink :to="`/${slug}`" class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
          <img
            v-if="config?.tenant.logo_url"
            :src="config.tenant.logo_url"
            :alt="config.tenant.name"
            class="w-full h-full object-cover"
            loading="eager"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-white text-sm font-bold"
            :style="{ backgroundColor: 'var(--color-primary)' }"
          >
            {{ storeName.charAt(0).toUpperCase() }}
          </div>
        </div>
        <span class="font-semibold text-gray-900 dark:text-white truncate text-base leading-tight">
          {{ storeName }}
        </span>
      </RouterLink>

      <!-- Actions -->
      <div class="flex items-center gap-1.5">
        <!-- Language toggle -->
        <button
          class="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="toggleLanguage"
        >
          <GlobeAltIcon class="w-4 h-4" />
          <span>{{ locale === 'en' ? 'SW' : 'EN' }}</span>
        </button>

        <!-- Dark mode toggle -->
        <button
          class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="toggleDark"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <SunIcon v-if="isDark" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>

        <!-- Cart button -->
        <button
          class="relative flex items-center gap-2 text-white rounded-xl px-3 py-2 font-semibold text-sm transition-all active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          @click="cartStore.openDrawer"
          :aria-label="`Cart with ${cartStore.itemCount} items`"
        >
          <ShoppingCartIcon class="w-5 h-5" />
          <span class="hidden sm:inline">{{ $t('nav.cart') }}</span>
          <TransitionGroup name="badge">
            <span
              v-if="cartStore.itemCount > 0"
              key="badge"
              class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-bounce-in"
            >
              {{ cartStore.itemCount > 99 ? '99+' : cartStore.itemCount }}
            </span>
          </TransitionGroup>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferredDark, useStorage } from '@vueuse/core'
import { ShoppingCartIcon, GlobeAltIcon, SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import { useCartStore } from '@/stores/cart'

const storefrontStore = useStorefrontStore()
const cartStore = useCartStore()
const { locale } = useI18n()

const config = computed(() => storefrontStore.config)
const slug = computed(() => storefrontStore.slug)
const storeName = computed(() => storefrontStore.storeName)

const prefersDark = usePreferredDark()
const storedTheme = useStorage<'light' | 'dark' | 'system'>('theme', 'system')
const isDark = computed(() => {
  if (storedTheme.value === 'system') return prefersDark.value
  return storedTheme.value === 'dark'
})

function toggleDark() {
  storedTheme.value = isDark.value ? 'light' : 'dark'
}

function toggleLanguage() {
  const next = locale.value === 'en' ? 'sw' : 'en'
  locale.value = next
  localStorage.setItem('lang', next)
}
</script>

<style scoped>
.badge-enter-active { transition: all 0.2s ease-out; }
.badge-leave-active { transition: all 0.15s ease-in; }
.badge-enter-from { transform: scale(0); opacity: 0; }
.badge-leave-to { transform: scale(0); opacity: 0; }
</style>
