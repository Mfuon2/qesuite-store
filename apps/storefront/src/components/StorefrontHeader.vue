<template>
  <header class="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
    <div class="mx-auto flex h-[3.25rem] max-w-7xl items-center gap-2.5 px-3 sm:h-14 sm:gap-3 sm:px-6 lg:px-8">
      <button
        class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-700 transition hover:bg-emerald-50 md:hidden"
        aria-label="Menu"
        @click="storefrontStore.openMobileMenu"
      >
        <Bars3Icon class="h-6 w-6" />
      </button>

      <!-- Logo + Store Name -->
      <RouterLink :to="`/${slug}`" class="flex min-w-0 shrink-0 items-center gap-2.5">
        <div class="h-8 w-8 flex-shrink-0 overflow-hidden rounded-xl bg-emerald-50 ring-1 ring-emerald-100 sm:h-10 sm:w-10">
          <img
            v-if="config?.tenant.logo_url"
            :src="config.tenant.logo_url"
            :alt="config.tenant.name"
            class="h-full w-full object-cover"
            loading="eager"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-sm font-bold text-white"
            :style="{ backgroundColor: 'var(--color-primary)' }"
          >
            {{ storeName.charAt(0).toUpperCase() }}
          </div>
        </div>
        <span class="max-w-[8rem] truncate text-sm font-extrabold leading-tight text-slate-950 sm:max-w-none sm:text-lg">
          {{ storeName }}
        </span>
      </RouterLink>

      <div class="relative hidden min-w-0 max-w-xl flex-1 md:block">
        <MagnifyingGlassIcon class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search for products..."
          class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.035)] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />
      </div>

      <!-- Location picker -->
      <div class="relative ml-auto hidden md:block">
        <button
          class="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 active:scale-[0.97]"
          @click="locationOpen = !locationOpen"
        >
          <MapPinIcon class="h-4 w-4 shrink-0" :class="locationGranted ? 'text-emerald-600' : 'text-slate-400'" />
          <span class="max-w-[180px] truncate">{{ locationLabel }}</span>
          <ChevronDownIcon class="h-3.5 w-3.5 shrink-0 text-slate-400 transition" :class="locationOpen ? 'rotate-180' : ''" />
        </button>

        <!-- Dropdown panel -->
        <Transition name="dropdown">
          <div
            v-if="locationOpen"
            class="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl"
          >
            <p class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Delivery location</p>

            <!-- GPS button -->
            <button
              class="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition"
              :class="locationGranted
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50'"
              :disabled="storefrontStore.locationStatus === 'requesting'"
              @click="useGPS"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" :class="locationGranted ? 'bg-emerald-100' : 'bg-slate-100'">
                <svg v-if="storefrontStore.locationStatus === 'requesting'" class="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <MapPinIcon v-else class="h-4 w-4" :class="locationGranted ? 'text-emerald-700' : 'text-slate-500'" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold" :class="locationGranted ? 'text-emerald-900' : 'text-slate-800'">
                  {{ storefrontStore.locationStatus === 'requesting' ? 'Detecting location…' : locationGranted ? 'Using GPS location' : 'Use my current location' }}
                </p>
                <p v-if="locationGranted && storefrontStore.userAddress" class="truncate text-xs text-emerald-700">{{ storefrontStore.userAddress }}</p>
                <p v-else-if="storefrontStore.locationStatus === 'denied'" class="text-xs text-red-500">Permission denied — enable in browser</p>
                <p v-else class="text-xs text-slate-400">Detect via GPS</p>
              </div>
              <span v-if="locationGranted" class="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            </button>

            <div class="my-3 flex items-center gap-2">
              <div class="h-px flex-1 bg-slate-100" />
              <span class="text-xs font-semibold text-slate-400">or type address</span>
              <div class="h-px flex-1 bg-slate-100" />
            </div>

            <!-- Manual address input -->
            <div class="relative">
              <MapPinIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="manualAddress"
                type="text"
                placeholder="Street, area, city…"
                class="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                @keydown.enter="applyManualAddress"
              />
            </div>
            <button
              class="mt-2 w-full rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
              :style="{ backgroundColor: 'var(--color-primary)' }"
              :disabled="!manualAddress.trim()"
              @click="applyManualAddress"
            >
              Set this location
            </button>
          </div>
        </Transition>

        <!-- Click-away backdrop -->
        <div v-if="locationOpen" class="fixed inset-0 z-40" @click="locationOpen = false" />
      </div>

      <div class="ml-auto flex items-center gap-1.5 md:ml-0">
        <!-- Language toggle -->
        <button
          class="hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-emerald-50 hover:text-slate-900 sm:flex"
          @click="toggleLanguage"
        >
          <GlobeAltIcon class="w-4 h-4" />
          <span>{{ locale === 'en' ? 'SW' : 'EN' }}</span>
        </button>

        <!-- Dark mode toggle -->
        <button
          class="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-slate-900 sm:block"
          @click="toggleDark"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <SunIcon v-if="isDark" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>

        <!-- Cart button -->
        <button
          class="store-cart-button relative grid h-10 w-10 place-items-center rounded-xl text-slate-800 transition-all hover:bg-emerald-50 active:scale-95 sm:flex sm:w-auto sm:gap-2 sm:px-3 sm:py-2 sm:text-white"
          @click="cartStore.openDrawer"
          :aria-label="`Cart with ${cartStore.itemCount} items`"
        >
          <ShoppingCartIcon class="h-5 w-5" />
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

    <div class="mx-auto flex max-w-7xl items-center gap-2 px-3 pb-2.5 md:hidden">
      <div class="relative min-w-0 flex-1">
        <MagnifyingGlassIcon class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search for products..."
          class="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-xs font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.035)] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:text-sm"
        />
      </div>
      <button
        class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-100 bg-white text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
        aria-label="Filters"
        @click="storefrontStore.openMobileFilters"
      >
        <AdjustmentsHorizontalIcon class="h-5 w-5" />
      </button>
    </div>

    <!-- Mobile location bar -->
    <button
      class="flex w-full items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-left md:hidden"
      @click="locationOpen = !locationOpen"
    >
      <MapPinIcon class="h-3.5 w-3.5 shrink-0" :class="locationGranted ? 'text-emerald-600' : 'text-slate-400'" />
      <span class="flex-1 truncate text-xs font-semibold text-slate-600">{{ locationLabel }}</span>
      <ChevronDownIcon class="h-3.5 w-3.5 shrink-0 text-slate-400" :class="locationOpen ? 'rotate-180' : ''" />
    </button>

    <!-- Mobile location panel (bottom sheet) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="locationOpen" class="fixed inset-0 z-50 flex items-end md:hidden" @click.self="locationOpen = false">
          <div class="w-full rounded-t-3xl border-t border-slate-100 bg-white px-5 pb-10 pt-4 shadow-2xl">
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <p class="mb-3 text-sm font-bold text-slate-950">Delivery location</p>

            <button
              class="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
              :class="locationGranted ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'"
              :disabled="storefrontStore.locationStatus === 'requesting'"
              @click="useGPS"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :class="locationGranted ? 'bg-emerald-100' : 'bg-slate-100'">
                <svg v-if="storefrontStore.locationStatus === 'requesting'" class="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <MapPinIcon v-else class="h-5 w-5" :class="locationGranted ? 'text-emerald-700' : 'text-slate-500'" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold" :class="locationGranted ? 'text-emerald-900' : 'text-slate-800'">
                  {{ storefrontStore.locationStatus === 'requesting' ? 'Detecting…' : locationGranted ? 'Using GPS location' : 'Use my current location' }}
                </p>
                <p v-if="locationGranted && storefrontStore.userAddress" class="truncate text-xs text-emerald-700">{{ storefrontStore.userAddress }}</p>
                <p v-else class="text-xs text-slate-400">Tap to detect via GPS</p>
              </div>
            </button>

            <div class="my-4 flex items-center gap-2">
              <div class="h-px flex-1 bg-slate-100" />
              <span class="text-xs font-semibold text-slate-400">or type address</span>
              <div class="h-px flex-1 bg-slate-100" />
            </div>

            <div class="relative">
              <MapPinIcon class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="manualAddress"
                type="text"
                placeholder="Street, area, city…"
                class="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                @keydown.enter="applyManualAddress"
              />
            </div>
            <button
              class="mt-3 w-full rounded-2xl py-3.5 text-sm font-bold text-white"
              :style="{ backgroundColor: 'var(--color-primary)' }"
              :disabled="!manualAddress.trim()"
              @click="applyManualAddress"
            >
              Set this location
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="storefrontStore.mobileMenuOpen" class="fixed inset-0 z-50 md:hidden">
          <button
            class="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            aria-label="Close menu"
            @click="storefrontStore.closeMobileMenu"
          ></button>
          <div class="absolute left-0 top-0 flex h-full w-[82vw] max-w-xs flex-col bg-white p-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="h-10 w-10 overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <img
                    v-if="config?.tenant.logo_url"
                    :src="config.tenant.logo_url"
                    :alt="config.tenant.name"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                    :style="{ backgroundColor: 'var(--color-primary)' }"
                  >
                    {{ storeName.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-extrabold text-slate-950">{{ storeName }}</p>
                  <p class="text-xs font-semibold text-slate-500">Shop categories</p>
                </div>
              </div>
              <button
                class="grid h-9 w-9 place-items-center rounded-xl border border-slate-100 text-slate-600"
                aria-label="Close menu"
                @click="storefrontStore.closeMobileMenu"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <div class="mt-5 space-y-1 overflow-y-auto">
              <button
                class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition"
                :class="storefrontStore.activeCategoryId === null ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'"
                @click="selectCategory(null)"
              >
                <Squares2X2Icon class="h-5 w-5" />
                All Products
              </button>
              <button
                v-for="cat in storefrontStore.categories"
                :key="cat.id"
                class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition"
                :class="storefrontStore.activeCategoryId === cat.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'"
                @click="selectCategory(cat.id)"
              >
                <span v-if="cat.icon" class="text-lg">{{ cat.icon }}</span>
                <TagIcon v-else class="h-5 w-5" />
                <span class="truncate">{{ cat.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferredDark, useStorage } from '@vueuse/core'
import {
  AdjustmentsHorizontalIcon, Bars3Icon, ChevronDownIcon, GlobeAltIcon, MagnifyingGlassIcon,
  MapPinIcon, MoonIcon, ShoppingCartIcon, Squares2X2Icon, SunIcon, TagIcon, XMarkIcon
} from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'
import { useCartStore } from '@/stores/cart'

const storefrontStore = useStorefrontStore()
const cartStore = useCartStore()
const { locale } = useI18n()

const config = computed(() => storefrontStore.config)
const slug = computed(() => storefrontStore.slug)
const storeName = computed(() => storefrontStore.storeName)
const searchQuery = computed({
  get: () => storefrontStore.searchQuery,
  set: (value: string) => storefrontStore.setSearchQuery(value),
})

// ── Location picker ────────────────────────────────────────────
const locationOpen = ref(false)
const manualAddress = ref('')

const locationGranted = computed(() => storefrontStore.locationStatus === 'granted')

const locationLabel = computed(() => {
  const status = storefrontStore.locationStatus
  if (status === 'requesting') return 'Detecting location…'
  if (status === 'granted') {
    return storefrontStore.userAddress
      ? storefrontStore.userAddress.split(',')[0].trim()
      : 'Location detected'
  }
  if (storefrontStore.userAddress) return storefrontStore.userAddress.split(',')[0].trim()
  return 'Set delivery location'
})

async function useGPS() {
  await storefrontStore.requestLocation()
  if (storefrontStore.locationStatus === 'granted') locationOpen.value = false
}

function applyManualAddress() {
  const addr = manualAddress.value.trim()
  if (!addr) return
  // Store as the user address without changing GPS coords
  storefrontStore.userAddress = addr
  manualAddress.value = ''
  locationOpen.value = false
}

// ── Theme / language ──────────────────────────────────────────
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

function selectCategory(id: string | null) {
  storefrontStore.setActiveCategory(id)
  storefrontStore.fetchProducts(id ?? undefined)
  storefrontStore.closeMobileMenu()
}
</script>

<style scoped>
.badge-enter-active { transition: all 0.2s ease-out; }
.badge-leave-active { transition: all 0.15s ease-in; }
.badge-enter-from { transform: scale(0); opacity: 0; }
.badge-leave-to { transform: scale(0); opacity: 0; }
.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.18s ease; }
.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.dropdown-enter-active { transition: all 0.15s ease-out; }
.dropdown-leave-active { transition: all 0.1s ease-in; }
.dropdown-enter-from { opacity: 0; transform: translateY(-6px) scale(0.98); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
@media (min-width: 640px) {
  .store-cart-button {
    background-color: var(--color-primary);
  }
}
</style>
