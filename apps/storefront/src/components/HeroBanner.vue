<template>
  <section class="relative overflow-hidden pt-3 sm:pt-4">
    <template v-if="loading">
      <div class="skeleton h-56 w-full rounded-2xl sm:h-72" />
    </template>

    <template v-else>
      <div class="relative overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.055)] sm:rounded-[1.6rem]">
        <div class="grid min-h-[11.5rem] items-stretch sm:min-h-[13rem] lg:min-h-[14rem] lg:grid-cols-[minmax(0,.45fr)_minmax(520px,.55fr)]">
          <div class="relative z-10 flex max-w-[72%] flex-col justify-center px-4 py-4 sm:max-w-none sm:px-7 sm:py-6 lg:py-8">
            <div class="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
              <div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:h-20 sm:w-20">
                <img
                  v-if="logoUrl"
                  :src="logoUrl"
                  :alt="storeName"
                  class="h-full w-full object-cover"
                />
                <span v-else class="text-xl font-extrabold text-emerald-700 sm:text-2xl">{{ storeInitial }}</span>
              </div>
              <div class="min-w-0">
                <h1 class="truncate text-xl font-extrabold leading-tight text-slate-950 sm:text-3xl">{{ storeName }}</h1>
                <p class="mt-1 text-xs font-semibold leading-snug text-slate-600 sm:text-base">Fresh shopping, easy checkout, quick delivery.</p>
              </div>
            </div>

            <div class="flex flex-nowrap items-center gap-x-1.5 overflow-hidden whitespace-nowrap text-[9px] font-bold leading-none text-slate-600 sm:flex-wrap sm:gap-x-3 sm:gap-y-2 sm:text-sm sm:leading-normal">
              <span class="text-emerald-700">4.8 ★</span>
              <span class="h-0.5 w-0.5 shrink-0 rounded-full bg-emerald-600 sm:h-1 sm:w-1"></span>
              <span v-if="deliveryEnabled" class="sm:hidden">{{ estimatedMinutes }} min</span>
              <span v-if="deliveryEnabled" class="hidden sm:inline">{{ estimatedMinutes }} min delivery</span>
              <span v-if="deliveryEnabled" class="h-0.5 w-0.5 shrink-0 rounded-full bg-emerald-600 sm:h-1 sm:w-1"></span>
              <span v-if="deliveryEnabled" class="sm:hidden">Delivery</span>
              <span v-if="deliveryEnabled" class="hidden sm:inline">Delivery available</span>
              <span v-if="pickupEnabled" class="h-0.5 w-0.5 shrink-0 rounded-full bg-emerald-600 sm:h-1 sm:w-1"></span>
              <span v-if="pickupEnabled" class="sm:hidden">Pickup</span>
              <span v-if="pickupEnabled" class="hidden sm:inline">Pickup available</span>
              <template v-if="distanceLabel">
                <span class="h-0.5 w-0.5 shrink-0 rounded-full bg-emerald-600 sm:h-1 sm:w-1"></span>
                <span class="inline-flex items-center gap-1 text-emerald-700">
                  <MapPinIcon class="h-3 w-3 sm:h-4 sm:w-4" />{{ distanceLabel }}
                </span>
              </template>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
              <button class="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-700/15 transition active:scale-95 sm:px-5 sm:text-sm" @click="$emit('shop-now')">
                Shop products
              </button>
              <div v-if="deliveryEnabled" class="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 sm:px-4 sm:text-sm">
                <TruckIcon class="h-4 w-4" />
                {{ estimatedMinutes }} min
              </div>
            </div>
          </div>

          <div class="absolute inset-y-0 right-0 w-[52%] overflow-hidden lg:hidden">
            <img
              :src="heroImage"
              :alt="storeName"
              class="absolute inset-y-0 right-0 h-full w-full object-cover object-center"
              loading="eager"
              fetchpriority="high"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-white via-white/55 to-transparent" />
            <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
            <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
          </div>

          <div class="relative hidden overflow-hidden lg:block">
            <img
              :src="heroImage"
              :alt="storeName"
              :class="[
                'absolute inset-y-0 right-0 h-full w-full object-cover',
                hasOwnerBanner ? 'object-center' : 'object-center'
              ]"
              loading="eager"
              fetchpriority="high"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-white via-white/25 to-transparent" />
            <div class="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent" />
            <div class="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent" />
            <div class="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/70 to-transparent" />
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPinIcon, TruckIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'

defineEmits<{ 'shop-now': [] }>()

const store = useStorefrontStore()
const loading = computed(() => store.loading)
const storeName = computed(() => store.storeName)
const logoUrl = computed(() => store.config?.tenant.logo_url)
const hasOwnerBanner = computed(() => Boolean(store.config?.tenant.banner_url))
const heroImage = computed(() => store.config?.tenant.banner_url || '/qesuite-storefront-hero-scene.png')
const storeInitial = computed(() => storeName.value.charAt(0).toUpperCase())
const estimatedMinutes = computed(() => store.estimatedMinutes)
const deliveryEnabled = computed(() => store.deliveryEnabled)
const pickupEnabled = computed(() => store.pickupEnabled)

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const distanceLabel = computed(() => {
  const uLat = store.userLat
  const uLng = store.userLng
  const sLat = store.config?.tenant.lat
  const sLng = store.config?.tenant.lng
  if (uLat == null || uLng == null || sLat == null || sLng == null) return null
  if (uLat === 0 && uLng === 0) return null  // address-only selection with no coords
  if (sLat === 0 && sLng === 0) return null  // store geocoded to ocean/invalid
  const km = haversineKm(uLat, uLng, sLat, sLng)
  if (km < 1) return `~${Math.round(km * 1000)}m away`
  if (km < 10) return `~${km.toFixed(1)}km away`
  return `~${Math.round(km)}km away`
})
</script>
