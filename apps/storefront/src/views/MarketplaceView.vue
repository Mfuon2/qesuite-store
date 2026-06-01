<template>
  <div class="min-h-screen bg-white text-slate-950">
    <header class="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
      <div class="mx-auto flex h-12 max-w-[1800px] items-center gap-3 px-4 sm:h-14 lg:px-6 xl:px-10 2xl:px-40">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div class="qs-brand-mark h-8 w-8 rounded-lg sm:h-10 sm:w-10" />
          <span class="qs-brand-word text-sm sm:text-xl"><span>Stores</span></span>
        </RouterLink>

        <div class="relative hidden min-w-0 max-w-xl flex-1 lg:block">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchInput"
            type="search"
            placeholder="Search stores, products, categories..."
            class="w-full rounded-xl border border-[#d0daca] bg-white/86 py-2.5 pl-12 pr-12 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">⌘K</span>
        </div>

        <div class="ml-auto hidden items-center gap-2 text-sm font-bold text-slate-800 md:flex">
          <MapPinIcon class="h-5 w-5 text-slate-600" />
          Nairobi, Kenya
          <ChevronDownIcon class="h-4 w-4 text-slate-500" />
        </div>

        <div class="hidden h-10 w-px bg-slate-200 md:block" />

        <button class="relative ml-auto grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-emerald-50 md:ml-0">
          <ShoppingCartIcon class="h-5 w-5 sm:h-6 sm:w-6" />
          <span class="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold leading-none text-white sm:-right-1 sm:-top-1 sm:h-5 sm:min-w-5 sm:text-xs">3</span>
        </button>
        <button class="relative hidden rounded-lg p-2 text-slate-600 transition hover:bg-emerald-50 sm:block">
          <BellIcon class="h-6 w-6" />
          <span class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">3</span>
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-[1800px] px-4 py-2 lg:px-6 xl:px-10 2xl:px-40">
      <section class="px-2 sm:px-4">
        <div class="grid items-end gap-6 pb-1 lg:grid-cols-[minmax(0,.39fr)_minmax(680px,.61fr)]">
          <div>
            <h1 class="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]">
              Discover Local Stores
            </h1>
            <p class="mt-1 max-w-xl text-xs leading-5 text-slate-600 sm:mt-1.5 sm:text-sm sm:leading-6">
              Shop from grocery stores, restaurants, pharmacies and more — all in one place.
            </p>
          </div>
          <div class="relative hidden h-28 overflow-hidden lg:block">
            <img
              src="/qesuite-marketplace-hero-clean-crop.png"
              alt=""
              class="absolute bottom-0 left-1/2 h-full max-w-full -translate-x-1/2 object-contain object-bottom [mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_84%,transparent_100%)]"
            />
            <div class="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent" />
            <div class="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div class="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white via-white/80 to-transparent" />
          </div>
        </div>
      </section>

      <section class="relative overflow-hidden rounded-[1.35rem] border border-slate-100/80 bg-white/95 p-2 shadow-[0_10px_32px_rgba(15,23,42,0.035)] sm:p-3">
        <div class="relative z-10 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide sm:gap-2">
          <button
            v-for="cat in visibleCategoryFilters"
            :key="cat.value"
            class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all sm:gap-2 sm:px-4 sm:text-sm"
            :class="activeCategory === cat.value
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-700/15'
              : 'border-slate-200/70 bg-white/90 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-800'"
            @click="setCategory(cat.value)"
          >
            <span>{{ cat.emoji }}</span>
            {{ cat.label }}
          </button>
        </div>
      </section>

      <section class="mt-3 rounded-[1.35rem] bg-white/95 p-3 shadow-[0_10px_32px_rgba(15,23,42,0.035)] ring-1 ring-slate-100/80">
        <div class="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-slate-950 sm:text-lg">Featured Near You</h2>
            <p class="text-xs font-medium text-slate-500 sm:text-sm">Top picks from stores in your area</p>
          </div>
          <button class="hidden items-center gap-1 text-sm font-bold text-emerald-700 sm:flex">
            View all
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <component
            :is="store.demo ? 'div' : RouterLink"
            v-for="store in featuredStores"
            :key="store.id"
            :to="store.demo ? undefined : `/${store.slug}`"
            class="group overflow-hidden rounded-2xl border border-slate-100/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          >
            <div class="relative h-16 overflow-hidden sm:h-20">
              <img v-if="store.bannerUrl" :src="store.bannerUrl" :alt="store.name" class="h-full w-full object-cover" />
              <div v-else :class="['absolute inset-0', store.bannerClass]" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <span :class="['absolute left-2.5 top-2.5 rounded-md px-2 py-1 text-[10px] font-extrabold text-white sm:left-3 sm:top-3 sm:text-xs', store.badgeClass]">
                {{ store.badge }}
              </span>
              <ChevronRightIcon class="absolute right-2.5 top-2.5 h-4 w-4 text-white/80 sm:right-3 sm:top-3 sm:h-5 sm:w-5" />
            </div>
            <div class="relative px-2.5 pb-3 pt-2 sm:px-3">
              <div class="mb-2 grid grid-cols-[2.65rem_minmax(0,1fr)] items-start gap-1.5 sm:grid-cols-[3rem_minmax(0,1fr)]">
                <div class="-mt-5 grid h-9 w-9 place-items-center overflow-hidden rounded-full border-4 border-white bg-white text-lg shadow-lg sm:h-10 sm:w-10 sm:text-xl">
                  <img v-if="store.logoUrl" :src="store.logoUrl" :alt="`${store.name} logo`" class="h-full w-full object-cover" />
                  <span v-else>{{ store.logo }}</span>
                </div>
                <div class="flex min-w-0 items-center gap-1 pt-2 text-[10px] font-bold leading-tight text-slate-500 sm:gap-1.5 sm:pt-2.5 sm:text-[11px]">
                  <p class="max-w-[5.5rem] shrink-0 truncate text-xs font-extrabold text-slate-950 group-hover:text-emerald-700 sm:max-w-[6.75rem] sm:text-sm">{{ store.name }}</p>
                  <span class="shrink-0 text-amber-500">★</span>
                  <span class="shrink-0">{{ store.rating }} ({{ store.reviews }})</span>
                  <span class="h-1 w-1 shrink-0 rounded-full bg-emerald-600"></span>
                  <span class="shrink-0">{{ store.delivery }}</span>
                </div>
              </div>
              <p class="text-[11px] font-medium text-slate-500 sm:text-xs">{{ store.category }} • {{ store.area }}</p>
              <span :class="['mt-2 inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs', store.offerClass]">
                {{ store.offer }}
              </span>
            </div>
          </component>
        </div>
      </section>

      <section class="mt-3 rounded-[1.35rem] bg-white/95 p-3 shadow-[0_10px_32px_rgba(15,23,42,0.035)] ring-1 ring-slate-100/80 sm:p-4">
        <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-extrabold text-slate-950 sm:text-xl">All Stores</h2>
            <p class="mt-0.5 text-xs font-medium text-slate-500 sm:mt-1 sm:text-sm">
              <template v-if="loading">Loading available stores...</template>
              <template v-else>Browse {{ displayStores.length }} available stores</template>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button class="rounded-xl border border-slate-100 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:px-4 sm:py-2.5 sm:text-sm">
              Sort by: <span class="text-slate-950">Popular</span>
            </button>
            <button class="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm">
              <FunnelIcon class="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div v-for="i in 4" :key="i" class="skeleton h-48 rounded-xl" />
        </div>

        <div v-else-if="displayStores.length === 0" class="rounded-2xl border border-dashed border-slate-100 bg-white/95 py-16 text-center">
          <BuildingStorefrontIcon class="mx-auto h-12 w-12 text-slate-300" />
          <p class="mt-3 text-sm font-bold text-slate-600">No stores found</p>
          <button class="mt-3 text-sm font-bold text-emerald-700" @click="clearFilters">Clear filters</button>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <component
            :is="store.demo ? 'div' : RouterLink"
            v-for="store in displayStores"
            :key="store.id"
            :to="store.demo ? undefined : `/${store.slug}`"
            class="group rounded-2xl border border-slate-100/80 bg-white/95 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-4"
          >
            <div class="flex items-start gap-3 sm:gap-4">
              <div :class="['grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full shadow-lg sm:h-14 sm:w-14', store.logoUrl ? 'bg-white' : store.logoBg]">
                <img v-if="store.logoUrl" :src="store.logoUrl" :alt="store.name" class="h-full w-full object-cover" />
                <span v-else class="text-2xl text-white sm:text-3xl">{{ store.logo }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="truncate text-sm font-extrabold text-slate-950 group-hover:text-emerald-700 sm:text-base">{{ store.name }}</p>
                  <span class="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-700 sm:text-xs">Open</span>
                </div>
                <p class="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500 sm:gap-2 sm:text-xs">
                  <span class="text-amber-500">★</span>{{ store.rating }} ({{ store.reviews }})
                  <span class="h-1 w-1 rounded-full bg-emerald-600"></span>{{ store.delivery }}
                </p>
                <p class="mt-1.5 text-xs font-medium text-slate-500 sm:mt-2 sm:text-sm">{{ store.category }} • {{ store.area }}</p>
              </div>
            </div>
            <div class="mt-3 rounded-lg bg-gradient-to-r from-emerald-50 to-transparent px-3 py-2">
              <span :class="['text-[11px] font-bold sm:text-xs', store.offerTextClass]">{{ store.offer }}</span>
            </div>
            <div class="mt-3 grid grid-cols-4 gap-2">
              <div
                v-for="product in store.products"
                :key="product.name"
                class="relative aspect-square overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100"
              >
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center p-1 text-center"
                >
                  <span class="line-clamp-2 text-[9px] font-semibold leading-tight text-slate-500 sm:text-[10px]">
                    {{ product.name.split(' ').slice(0, 2).join(' ') }}
                  </span>
                </div>
              </div>
            </div>
          </component>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Bars3Icon, BellIcon, BuildingStorefrontIcon, ChevronDownIcon, ChevronRightIcon,
  ClockIcon, FunnelIcon, GiftIcon, MagnifyingGlassIcon, MapPinIcon,
  ShoppingBagIcon, ShoppingCartIcon, TagIcon
} from '@heroicons/vue/24/outline'
import { getStores, type StoreListItem, type ProductPreview } from '@/api/storefront'

type MarketplaceStore = {
  id: string
  slug: string
  name: string
  category: string
  area: string
  logo: string
  logoBg: string
  logoUrl?: string | null
  bannerUrl?: string | null
  rating: string
  reviews: number
  delivery: string
  offer: string
  offerClass: string
  offerTextClass: string
  badge: string
  badgeClass: string
  bannerClass: string
  products: ProductPreview[]
  demo?: boolean
}

const categoryFilters = [
  { value: 'all', label: 'All Stores', emoji: '🏪' },
  { value: 'groceries', label: 'Groceries', emoji: '🛒' },
  { value: 'food', label: 'Food', emoji: '🍔' },
  { value: 'pharmacy', label: 'Pharmacy', emoji: '🧪' },
  { value: 'electronics', label: 'Electronics', emoji: '📱' },
  { value: 'beauty', label: 'Beauty', emoji: '💄' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'more', label: 'More', emoji: '•••' },
]

const visibleCategoryFilters = computed(() => categoryFilters)
const stores = ref<StoreListItem[]>([])
const loading = ref(true)
const activeCategory = ref('all')
const searchInput = ref('')

const p = (name: string): ProductPreview => ({ name, image_url: null })

const demoStores: MarketplaceStore[] = [
  makeStore('green-grocers', 'Green Grocers', 'Groceries', 'Westlands', '🌿', 'bg-gradient-to-br from-lime-500 to-emerald-700', '4.7', 250, '20–30 mins', 'Free delivery on orders over KES 1,000', [p('Avocado'), p('Spinach'), p('Whole Milk'), p('Banana')], 'Fast Delivery'),
  makeStore('pharmaplus', 'PharmaPlus', 'Pharmacy', 'Kilimani', '✚', 'bg-gradient-to-br from-blue-400 to-blue-700', '4.8', 190, '15–25 mins', 'Up to 20% off selected items', [p('Tissue Paper'), p('Vitamin C'), p('Sanitizer'), p('Pain Relief')], 'Top Rated'),
  makeStore('tasty-bites', 'Tasty Bites', 'Food', 'Upper Hill', '🍴', 'bg-gradient-to-br from-orange-400 to-orange-700', '4.6', 160, '20–30 mins', 'Free delivery on orders over KES 800', [p('Burger'), p('Noodles'), p('Fries'), p('Cold Drink')], 'Popular'),
  makeStore('tech-world', 'Tech World', 'Electronics', 'Westlands', '🖥️', 'bg-gradient-to-br from-violet-500 to-purple-700', '4.5', 98, '25–35 mins', '5% off on all accessories', [p('Headphones'), p('Smartphone'), p('Mouse'), p('Charger')], 'Open Now'),
]

const stats = computed(() => [
  { value: storeCount.value, label: 'Stores Open', icon: ShoppingBagIcon, tone: 'bg-emerald-100 text-emerald-700' },
  { value: '24 mins', label: 'Avg. Delivery Time', icon: ClockIcon, tone: 'bg-amber-100 text-amber-700' },
  { value: '36', label: 'Offers Today', icon: TagIcon, tone: 'bg-violet-100 text-violet-700' },
  { value: 'Nairobi, Kenya', label: 'Delivering to your area', icon: MapPinIcon, tone: 'bg-emerald-100 text-emerald-700' },
])

const storeCount = computed(() => String(stores.value.length))

const displayStores = computed(() => {
  const fromApi = stores.value.map((store, index) => fromStoreListItem(store, index))
  const query = searchInput.value.trim().toLowerCase()
  if (!query) return fromApi
  return fromApi.filter(store =>
    store.name.toLowerCase().includes(query) ||
    store.category.toLowerCase().includes(query) ||
    store.area.toLowerCase().includes(query)
  )
})

const featuredStores = computed(() =>
  displayStores.value.slice(0, 4).map((store, index) => ({
    ...store,
    badge: ['Fast Delivery', 'Top Rated', 'Open Now', 'Popular'][index] ?? store.badge,
  }))
)

function makeStore(
  slug: string,
  name: string,
  category: string,
  area: string,
  logo: string,
  logoBg: string,
  rating: string,
  reviews: number,
  delivery: string,
  offer: string,
  products: ProductPreview[],
  badge: string,
  media?: { logoUrl?: string | null; bannerUrl?: string | null }
): MarketplaceStore {
  const tone = category.toLowerCase()
  return {
    id: slug,
    slug,
    name,
    category,
    area,
    logo,
    logoBg,
    logoUrl: media?.logoUrl,
    bannerUrl: media?.bannerUrl,
    rating,
    reviews,
    delivery,
    offer,
    products,
    demo: slug.startsWith('demo-'),
    badge,
    badgeClass: tone.includes('food') ? 'bg-orange-500' : tone.includes('pharmacy') ? 'bg-violet-500' : 'bg-emerald-600',
    bannerClass: tone.includes('food')
      ? 'bg-[radial-gradient(circle_at_72%_34%,rgba(255,255,255,.7),transparent_5rem),linear-gradient(135deg,#fff7ed,#fed7aa)]'
      : tone.includes('pharmacy')
      ? 'bg-[radial-gradient(circle_at_72%_34%,rgba(255,255,255,.75),transparent_5rem),linear-gradient(135deg,#eff6ff,#bfdbfe)]'
      : tone.includes('electronics')
      ? 'bg-[radial-gradient(circle_at_72%_34%,rgba(255,255,255,.75),transparent_5rem),linear-gradient(135deg,#f5f3ff,#ddd6fe)]'
      : 'bg-[radial-gradient(circle_at_72%_34%,rgba(255,255,255,.75),transparent_5rem),linear-gradient(135deg,#f0fdf4,#bbf7d0)]',
    offerClass: tone.includes('food') ? 'bg-orange-50 text-orange-700' : tone.includes('pharmacy') ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700',
    offerTextClass: tone.includes('food') ? 'text-orange-700' : tone.includes('pharmacy') ? 'text-violet-700' : 'text-emerald-700',
  }
}


function fromStoreListItem(store: StoreListItem, index: number): MarketplaceStore {
  const category = categoryLabel(store.store_category)
  const fallback = demoStores[index % demoStores.length]
  return makeStore(
    store.slug,
    store.name,
    category,
    store.address || fallback.area,
    categoryEmoji(store.store_category),
    fallback.logoBg,
    (4.9 - (index % 5) * 0.1).toFixed(1),
    90 + index * 32,
    ['15–25 mins', '20–30 mins', '25–35 mins'][index % 3],
    fallback.offer,
    store.product_previews?.length ? store.product_previews : fallback.products,
    fallback.badge,
    { logoUrl: store.logo_url, bannerUrl: store.banner_url }
  )
}

function categoryEmoji(category: string) {
  const match = categoryFilters.find(item => item.value === category)
  return match?.emoji && match.emoji !== '•••' ? match.emoji : '🏪'
}

function categoryLabel(category: string) {
  return categoryFilters.find(item => item.value === category)?.label ?? 'Store'
}

async function load() {
  loading.value = true
  try {
    stores.value = await getStores({
      category: activeCategory.value === 'all' || activeCategory.value === 'more' ? undefined : activeCategory.value,
    })
  } finally {
    loading.value = false
  }
}

function setCategory(category: string) {
  activeCategory.value = category
  load()
}

function clearFilters() {
  activeCategory.value = 'all'
  searchInput.value = ''
  load()
}

onMounted(load)
</script>
