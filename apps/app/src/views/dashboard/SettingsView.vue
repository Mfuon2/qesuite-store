<template>
  <div class="owner-page">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <div class="owner-eyebrow">
            Store control center
          </div>
          <h1 class="owner-title">Settings</h1>
          <p class="owner-subtitle">
            Keep the public storefront, checkout options, and daily working preferences aligned from one simple workspace.
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Storefront</p>
            <p class="mt-1 max-w-[220px] truncate text-sm font-semibold text-slate-800">
              {{ settingsStore.tenant?.slug ? `/${settingsStore.tenant.slug}` : '/your-store' }}
            </p>
          </div>

          <button
            @click="saveAll"
            :disabled="settingsStore.saving"
            class="owner-primary-action"
          >
            <svg v-if="settingsStore.saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <CheckIcon v-else class="h-4 w-4" />
            Save changes
          </button>
        </div>
      </div>
    </section>

    <div class="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_390px]">
      <aside class="xl:sticky xl:top-24 xl:self-start">
        <div class="qs-card-soft rounded-[26px] p-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition',
              activeTab === tab.id
                ? 'owner-brand-active bg-primary text-white'
                : 'owner-brand-hover text-slate-600 hover:text-slate-950'
            ]"
          >
            <span
              :class="[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 transition',
                activeTab === tab.id
                  ? 'bg-white/18 text-white ring-white/20'
                  : 'owner-brand-surface text-primary'
              ]"
            >
              <component :is="tab.icon" class="h-5 w-5" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold">{{ tab.label }}</span>
              <span :class="['block truncate text-xs', activeTab === tab.id ? 'text-white/72' : 'text-slate-400']">
                {{ tab.description }}
              </span>
            </span>
          </button>
        </div>

        <div class="qs-card-soft mt-4 rounded-[26px] p-4">
          <p class="text-sm font-bold text-slate-950">Setup health</p>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-slate-500">Branding</span>
              <span class="text-primary">{{ brandingComplete }}/4</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${brandingProgress}%` }" />
            </div>
            <p class="text-xs leading-5 text-slate-500">
              Add a logo, banner, colors, and contact details to make your storefront feel complete.
            </p>
          </div>
        </div>
      </aside>

      <main class="min-w-0">
        <div class="qs-card-soft overflow-hidden rounded-[28px]">
          <div class="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">{{ activeTabMeta.kicker }}</p>
                <h2 class="mt-1 text-xl font-bold text-slate-950">{{ activeTabMeta.title }}</h2>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ activeTabMeta.detail }}</p>
              </div>
              <button
                class="owner-secondary-action min-h-10 py-2"
                @click="activeTab = 'branding'"
                v-if="activeTab !== 'branding'"
              >
                Edit branding
              </button>
            </div>
          </div>

          <div class="p-5 sm:p-6">
            <section v-show="activeTab === 'store'" class="space-y-5">
              <div class="grid gap-4 lg:grid-cols-2">
                <label class="block">
                  <span class="admin-label">Store name</span>
                  <input v-model="tenant.name" type="text" placeholder="My Store" class="admin-input mt-2" />
                </label>
                <label class="block">
                  <span class="admin-label">Phone</span>
                  <input v-model="tenant.phone" type="tel" placeholder="+254700000000" class="admin-input mt-2" />
                </label>
                <div class="lg:col-span-2">
                  <span class="admin-label block mb-2">Store location</span>
                  <p class="mb-1.5 text-xs font-medium text-slate-400">Search and select to pin exact coordinates for the customer map.</p>
                  <LocationSearch
                    :model-value="tenant.address || ''"
                    placeholder="Search store location…"
                    @update:model-value="tenant.address = $event"
                    @select="onLocationSelect"
                  />
                </div>
                <label class="block lg:col-span-2">
                  <span class="admin-label">WhatsApp business</span>
                  <input v-model="tenant.whatsapp_number" type="tel" placeholder="+254700000000" class="admin-input mt-2" />
                </label>
              </div>

              <div class="owner-brand-surface rounded-[24px] border p-4">
                <div class="flex items-start gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <GlobeAltIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-950">Customer-facing details</p>
                    <p class="mt-1 text-sm leading-6 text-slate-600">
                      These fields appear on the storefront and checkout journey, so keep them short, recognizable, and easy to contact.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section v-show="activeTab === 'branding'" class="space-y-6">
              <div class="grid gap-4 lg:grid-cols-2">
                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <span class="admin-label">Store logo</span>
                    <span class="text-xs font-medium text-slate-400">Square works best</span>
                  </div>
                  <ImageUpload ref="logoRef" :model-value="tenant.logo_url || ''" @file-selected="f => uploadFile(f, 'logo')" />
                </div>
                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <span class="admin-label">Store banner</span>
                    <span class="text-xs font-medium text-slate-400">Up to 10MB</span>
                  </div>
                  <ImageUpload ref="bannerRef" :model-value="tenant.banner_url || ''" @file-selected="f => uploadFile(f, 'banner')" />
                </div>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-[24px] border border-slate-100 bg-slate-50/60 p-4">
                  <label class="admin-label">Primary color</label>
                  <ColorPicker v-model="tenant.primary_color" label="Primary color" class="mt-3" @update:model-value="applyPreview" />
                </div>
                <div class="rounded-[24px] border border-slate-100 bg-slate-50/60 p-4">
                  <label class="admin-label">Accent color</label>
                  <ColorPicker v-model="tenant.accent_color" label="Accent color" class="mt-3" @update:model-value="applyPreview" />
                </div>
                <label class="block lg:col-span-2">
                  <span class="admin-label">Store font</span>
                  <select v-model="tenant.font_family" class="admin-input mt-2" @change="applyPreview">
                    <option v-for="font in fonts" :key="font" :value="font" :style="{ fontFamily: font }">
                      {{ font }}
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <section v-show="activeTab === 'delivery'" class="space-y-5">
              <div class="grid gap-4 lg:grid-cols-2">
                <button
                  type="button"
                  @click="storeSettings.delivery_enabled = !storeSettings.delivery_enabled"
                  :class="[
                    'rounded-[24px] border p-4 text-left transition',
                    storeSettings.delivery_enabled
                      ? 'owner-brand-selected'
                      : 'border-slate-100 bg-white'
                  ]"
                >
                  <div class="flex items-center justify-between gap-4">
                    <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <TruckIcon class="h-5 w-5" />
                    </span>
                    <span class="qs-toggle" :class="storeSettings.delivery_enabled ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="storeSettings.delivery_enabled ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                  <p class="mt-4 text-sm font-bold text-slate-950">Delivery</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">Let customers place orders for rider dispatch.</p>
                </button>

                <button
                  type="button"
                  @click="storeSettings.pickup_enabled = !storeSettings.pickup_enabled"
                  :class="[
                    'rounded-[24px] border p-4 text-left transition',
                    storeSettings.pickup_enabled
                      ? 'owner-brand-selected'
                      : 'border-slate-100 bg-white'
                  ]"
                >
                  <div class="flex items-center justify-between gap-4">
                    <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <ShoppingBagIcon class="h-5 w-5" />
                    </span>
                    <span class="qs-toggle" :class="storeSettings.pickup_enabled ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="storeSettings.pickup_enabled ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                  <p class="mt-4 text-sm font-bold text-slate-950">Pickup</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">Allow customers to collect from your store.</p>
                </button>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <label class="block">
                  <span class="admin-label">Delivery fee (KES)</span>
                  <input v-model.number="storeSettings.delivery_fee" type="number" min="0" class="admin-input mt-2" />
                </label>
                <label class="block">
                  <span class="admin-label">Delivery radius (km)</span>
                  <input v-model.number="storeSettings.delivery_radius_km" type="number" min="1" class="admin-input mt-2" />
                </label>
                <label class="block">
                  <span class="admin-label">Estimated time (minutes)</span>
                  <input v-model.number="storeSettings.estimated_delivery_minutes" type="number" min="5" class="admin-input mt-2" />
                </label>
                <label class="block">
                  <span class="admin-label">Minimum order (KES)</span>
                  <input v-model.number="storeSettings.min_order_amount" type="number" min="0" class="admin-input mt-2" />
                </label>
              </div>
            </section>

            <section v-show="activeTab === 'prefs'" class="space-y-5">
              <div class="grid gap-4 lg:grid-cols-2">
                <button
                  type="button"
                  class="owner-brand-hover rounded-[24px] border border-slate-100 bg-white p-4 text-left transition"
                  @click="settingsStore.toggleDarkMode()"
                >
                  <div class="flex items-center justify-between gap-4">
                    <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                      <MoonIcon v-if="settingsStore.darkMode" class="h-5 w-5" />
                      <SunIcon v-else class="h-5 w-5" />
                    </span>
                    <span class="qs-toggle" :class="settingsStore.darkMode ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="settingsStore.darkMode ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                  <p class="mt-4 text-sm font-bold text-slate-950">Dark mode</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">Switch the owner dashboard theme.</p>
                </button>

                <div class="rounded-[24px] border border-slate-100 bg-white p-4">
                  <p class="text-sm font-bold text-slate-950">Order view</p>
                  <p class="mt-1 text-sm text-slate-500">Choose how orders open by default.</p>
                  <div class="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      @click="settingsStore.setOrderView('kanban')"
                      :class="[
                        'inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition',
                        settingsStore.orderView === 'kanban'
                          ? 'owner-brand-active bg-primary text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      ]"
                    >
                      <Squares2X2Icon class="h-4 w-4" />
                      Kanban
                    </button>
                    <button
                      type="button"
                      @click="settingsStore.setOrderView('list')"
                      :class="[
                        'inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition',
                        settingsStore.orderView === 'list'
                          ? 'owner-brand-active bg-primary text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      ]"
                    >
                      <ListBulletIcon class="h-4 w-4" />
                      List
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <label class="block">
                  <span class="admin-label">Language</span>
                  <select v-model="storeSettings.language" class="admin-input mt-2">
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </label>
                <button
                  type="button"
                  class="owner-brand-hover rounded-[24px] border border-slate-100 bg-white p-4 text-left transition"
                  @click="settingsStore.toggleSound()"
                >
                  <div class="flex items-center justify-between gap-4">
                    <span>
                      <span class="block text-sm font-bold text-slate-950">Notification sounds</span>
                      <span class="mt-1 block text-sm text-slate-500">Play alerts for new activity.</span>
                    </span>
                    <span class="qs-toggle" :class="settingsStore.soundEnabled ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="settingsStore.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <aside class="xl:sticky xl:top-24 xl:self-start">
        <div class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-500">
          <EyeIcon class="h-4 w-4" />
          Storefront preview
        </div>

        <div class="qs-card-soft overflow-hidden rounded-[30px]">
          <div class="owner-brand-surface relative h-44 overflow-hidden">
            <img
              :src="tenant.banner_url || '/qesuite-marketplace-reference.png'"
              alt=""
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/20" />
            <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            <div class="absolute left-5 top-5 flex items-start gap-3">
              <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/80 bg-white text-2xl font-black text-primary shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <img v-if="tenant.logo_url" :src="tenant.logo_url" alt="" class="h-full w-full object-cover" />
                <span v-else>{{ storeInitial }}</span>
              </div>
              <div class="min-w-0 pt-1">
                <p class="truncate text-lg font-black text-slate-950" :style="{ fontFamily: tenant.font_family }">
                  {{ tenant.name || 'Your Store' }}
                </p>
                <p class="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">
                  Fresh shopping, easy checkout, quick delivery.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-4 p-5">
            <div class="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span class="owner-brand-surface rounded-full px-3 py-1.5 text-primary">Open</span>
              <span>{{ storeSettings.estimated_delivery_minutes }} min</span>
              <span class="h-1 w-1 rounded-full bg-primary" />
              <span v-if="storeSettings.delivery_enabled">Delivery</span>
              <span v-if="storeSettings.pickup_enabled">Pickup</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div v-for="item in previewItems" :key="item.name" class="rounded-[18px] border border-slate-100 bg-slate-50/80 p-3">
                <div class="mb-3 flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-black text-primary shadow-sm">
                  {{ item.badge }}
                </div>
                <p class="truncate text-xs font-bold text-slate-700">{{ item.name }}</p>
                <p class="mt-1 text-xs font-black text-primary">KES {{ item.price }}</p>
              </div>
            </div>

            <div class="owner-brand-surface rounded-2xl border p-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-bold text-slate-800">Live preview</span>
                <span class="h-2 w-16 rounded-full" :style="{ backgroundColor: previewAccent }" />
              </div>
              <p class="mt-1 text-xs font-medium leading-5 text-slate-500">
                The panel updates as you change logo, banner, colors, and store details.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon,
  CheckIcon,
  EyeIcon,
  GlobeAltIcon,
  ListBulletIcon,
  MoonIcon,
  PaintBrushIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  SunIcon,
  TruckIcon
} from '@heroicons/vue/24/outline'
import ImageUpload from '@/components/dashboard/ImageUpload.vue'
import ColorPicker from '@/components/dashboard/ColorPicker.vue'
import LocationSearch from '@/components/dashboard/LocationSearch.vue'
import { useSettingsStore } from '@/stores/settings'
import { apiGetUploadUrl } from '@/api/settings'
import { beginNetworkActivity, endNetworkActivity } from '@/composables/useNetworkActivity'
import type { Language } from '@qesuite/types'

const settingsStore = useSettingsStore()
const fonts = ['Inter', 'Poppins', 'DM Sans', 'Nunito']
const logoRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const bannerRef = ref<InstanceType<typeof ImageUpload> | null>(null)

const tabs = [
  {
    id: 'store',
    label: 'Store Info',
    description: 'Name, address, contacts',
    title: 'Store information',
    kicker: 'Identity',
    detail: 'Set the details customers use to recognize, contact, and visit your store.',
    icon: BuildingStorefrontIcon
  },
  {
    id: 'branding',
    label: 'Branding',
    description: 'Logo, banner, colors',
    title: 'Branding',
    kicker: 'Look and feel',
    detail: 'Tune the visual system used by your public storefront and customer checkout.',
    icon: PaintBrushIcon
  },
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'Pickup, radius, fees',
    title: 'Delivery and pickup',
    kicker: 'Fulfillment',
    detail: 'Control how customers receive orders and what delivery promises they see.',
    icon: TruckIcon
  },
  {
    id: 'prefs',
    label: 'Preferences',
    description: 'Language and dashboard',
    title: 'Workspace preferences',
    kicker: 'Operations',
    detail: 'Choose defaults that make the dashboard comfortable for daily work.',
    icon: AdjustmentsHorizontalIcon
  }
] as const

type TabId = typeof tabs[number]['id']

const activeTab = ref<TabId>('store')

const tenant = reactive({
  name: settingsStore.tenant?.name ?? '',
  phone: settingsStore.tenant?.phone ?? '',
  address: settingsStore.tenant?.address ?? '',
  lat: (settingsStore.tenant as unknown as { lat?: number | null })?.lat ?? null as number | null,
  lng: (settingsStore.tenant as unknown as { lng?: number | null })?.lng ?? null as number | null,
  whatsapp_number: settingsStore.tenant?.whatsapp_number ?? '',
  logo_url: settingsStore.tenant?.logo_url ?? null,
  banner_url: settingsStore.tenant?.banner_url ?? null,
  primary_color: settingsStore.tenant?.primary_color ?? '#10b981',
  accent_color: settingsStore.tenant?.accent_color ?? '#0d9488',
  font_family: settingsStore.tenant?.font_family ?? 'Inter'
})

function onLocationSelect(payload: { address: string; lat: number; lng: number }) {
  tenant.address = payload.address
  tenant.lat = payload.lat || null
  tenant.lng = payload.lng || null
}

const storeSettings = reactive({
  delivery_enabled: settingsStore.storeSettings?.delivery_enabled ?? true,
  pickup_enabled: settingsStore.storeSettings?.pickup_enabled ?? true,
  delivery_fee: settingsStore.storeSettings?.delivery_fee ?? 0,
  delivery_radius_km: settingsStore.storeSettings?.delivery_radius_km ?? 10,
  estimated_delivery_minutes: settingsStore.storeSettings?.estimated_delivery_minutes ?? 30,
  min_order_amount: settingsStore.storeSettings?.min_order_amount ?? 0,
  language: (settingsStore.storeSettings?.language ?? 'en') as Language
})

const previewPrimary = ref(tenant.primary_color)
const previewAccent = ref(tenant.accent_color)

// Sync form from store whenever tenant data loads or refreshes
watch(() => settingsStore.tenant, (t) => {
  if (!t) return
  tenant.name = t.name
  tenant.phone = t.phone ?? ''
  tenant.address = t.address ?? ''
  tenant.whatsapp_number = t.whatsapp_number ?? ''
  tenant.logo_url = t.logo_url
  tenant.banner_url = t.banner_url
  tenant.primary_color = t.primary_color
  tenant.accent_color = t.accent_color
  tenant.font_family = t.font_family
  previewPrimary.value = t.primary_color
  previewAccent.value = t.accent_color
})

watch(() => settingsStore.storeSettings, (s) => {
  if (!s) return
  storeSettings.delivery_enabled = s.delivery_enabled
  storeSettings.pickup_enabled = s.pickup_enabled
  storeSettings.delivery_fee = s.delivery_fee
  storeSettings.delivery_radius_km = s.delivery_radius_km
  storeSettings.estimated_delivery_minutes = s.estimated_delivery_minutes
  storeSettings.min_order_amount = s.min_order_amount
  storeSettings.language = s.language as Language
})

const activeTabMeta = computed(() => tabs.find(tab => tab.id === activeTab.value) ?? tabs[0])
const storeInitial = computed(() => (tenant.name || 'S').trim().charAt(0).toUpperCase() || 'S')
const brandingComplete = computed(() => [
  tenant.logo_url,
  tenant.banner_url,
  tenant.primary_color,
  tenant.phone || tenant.whatsapp_number
].filter(Boolean).length)
const brandingProgress = computed(() => Math.round((brandingComplete.value / 4) * 100))

const previewItems = [
  { name: 'Tomatoes', price: 80, badge: 'T' },
  { name: 'Milk', price: 60, badge: 'M' },
  { name: 'Bread', price: 90, badge: 'B' }
]

function applyPreview() {
  previewPrimary.value = tenant.primary_color
  previewAccent.value = tenant.accent_color
  document.documentElement.style.setProperty('--color-primary', tenant.primary_color)
  document.documentElement.style.setProperty('--color-accent', tenant.accent_color)
  document.documentElement.style.setProperty('--font-family', `'${tenant.font_family}', sans-serif`)
}

async function uploadFile(file: File, type: 'logo' | 'banner') {
  const imgRef = type === 'logo' ? logoRef.value : bannerRef.value
  const activity = beginNetworkActivity('Uploading brand image')
  try {
    const presignRes = await apiGetUploadUrl(file.name, file.type, type === 'logo' ? 'logo' : 'banner')
    if (!presignRes.success || !presignRes.data) throw new Error('Failed to get upload URL')
    const { upload_url, public_url } = presignRes.data

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable && imgRef) imgRef.setProgress(Math.round(e.loaded / e.total * 100))
      })
      xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
      xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
      xhr.open('PUT', upload_url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    if (type === 'logo') tenant.logo_url = public_url
    else tenant.banner_url = public_url
    imgRef?.setPreview(public_url)

    // Persist the URL immediately so it survives navigation/reload
    await settingsStore.updateTenant({
      logo_url: tenant.logo_url,
      banner_url: tenant.banner_url
    }, true)
  } catch (err: unknown) {
    console.error('uploadFile error', err)
  } finally {
    endNetworkActivity(activity)
  }
}

async function saveAll() {
  await Promise.all([
    settingsStore.updateTenant({
      name: tenant.name,
      phone: tenant.phone || null,
      address: tenant.address || null,
      ...(tenant.lat != null ? { lat: tenant.lat } : {}),
      ...(tenant.lng != null ? { lng: tenant.lng } : {}),
      whatsapp_number: tenant.whatsapp_number || null,
      logo_url: tenant.logo_url,
      banner_url: tenant.banner_url,
      primary_color: tenant.primary_color,
      accent_color: tenant.accent_color,
      font_family: tenant.font_family
    }),
    settingsStore.updateStoreSettings({
      delivery_enabled: storeSettings.delivery_enabled,
      pickup_enabled: storeSettings.pickup_enabled,
      delivery_fee: storeSettings.delivery_fee,
      delivery_radius_km: storeSettings.delivery_radius_km,
      estimated_delivery_minutes: storeSettings.estimated_delivery_minutes,
      min_order_amount: storeSettings.min_order_amount,
      language: storeSettings.language,
      dark_mode_enabled: settingsStore.darkMode,
      order_view: settingsStore.orderView
    })
  ])
}

onMounted(() => {
  // Fetch fresh data from the server; the watches above sync the form reactively
  Promise.all([settingsStore.fetchTenant(), settingsStore.fetchStoreSettings()])
})
</script>
