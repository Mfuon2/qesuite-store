<template>
  <div
    class="owner-page settings-dense"
    :class="activeTab === 'access' ? 'xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden' : ''"
  >
    <section class="owner-page-hero !rounded-2xl !p-3 sm:!rounded-[22px] sm:!p-4">
      <div class="owner-page-header !gap-3">
        <div class="min-w-0">
          <h1 class="owner-title !mt-0 !text-xl sm:!text-2xl">Settings</h1>
          <p class="owner-subtitle !mt-0.5 !text-xs !leading-5 sm:!text-sm">
            Keep the public storefront, checkout options, and daily working preferences aligned from one simple workspace.
          </p>
        </div>

        <div class="flex items-center gap-2 sm:shrink-0">
          <div class="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm sm:flex-none">
            <p class="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Storefront</p>
            <p class="mt-0.5 max-w-[180px] truncate text-xs font-semibold text-slate-800">
              {{ settingsStore.tenant?.slug ? `/${settingsStore.tenant.slug}` : '/your-store' }}
            </p>
          </div>

          <button
            v-if="isDesktop && activeTab !== 'access' && accessStore.can('settings.edit')"
            @click="saveAll"
            :disabled="settingsStore.saving"
            class="owner-primary-action !min-h-9 shrink-0 !rounded-xl !px-3 !py-2 !text-xs"
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

    <div
      class="mt-3 grid gap-3"
      :class="activeTab === 'access'
        ? 'xl:min-h-0 xl:flex-1 xl:grid-cols-[220px_minmax(0,1fr)]'
        : 'xl:grid-cols-[220px_minmax(0,1fr)_320px]'"
    >
      <!-- Mobile/tablet: settings sections as tappable tiles, each opening a modal -->
      <div class="grid grid-cols-2 gap-2 xl:hidden">
        <button
          v-for="tab in visibleTabs"
          :key="tab.id"
          type="button"
          class="qs-card-soft flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition active:scale-[0.98]"
          @click="openMobileSection(tab.id)"
        >
          <span class="owner-brand-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary">
            <component :is="tab.icon" class="h-4 w-4" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-bold text-slate-950">{{ tab.label }}</span>
            <span class="mt-0.5 block truncate text-[11px] text-slate-500">{{ tab.description }}</span>
          </span>
        </button>
      </div>

      <!-- Desktop: sticky sidebar nav, sections shown inline -->
      <aside class="hidden min-w-0 xl:block xl:sticky xl:top-24 xl:self-start">
        <div class="flex flex-col gap-1 rounded-2xl bg-white/80 p-1.5 shadow-sm">
          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex w-full shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition',
              activeTab === tab.id
                ? 'owner-brand-active bg-primary text-white'
                : 'owner-brand-hover text-slate-600 hover:text-slate-950'
            ]"
          >
            <span
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition',
                activeTab === tab.id
                  ? 'bg-white/18 text-white ring-white/20'
                  : 'owner-brand-surface text-primary'
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold">{{ tab.label }}</span>
              <span :class="['block truncate text-[11px]', activeTab === tab.id ? 'text-white/72' : 'text-slate-400']">
                {{ tab.description }}
              </span>
            </span>
          </button>
        </div>

        <div class="qs-card-soft mt-3 rounded-2xl p-3">
          <p class="text-sm font-bold text-slate-950">Setup health</p>
          <div class="mt-3 space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-slate-500">Branding</span>
              <span class="text-primary">{{ brandingComplete }}/4</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${brandingProgress}%` }" />
            </div>
            <p class="text-[11px] leading-4 text-slate-500">
              Add a logo, banner, colors, and contact details to make your storefront feel complete.
            </p>
          </div>
        </div>
      </aside>

      <!-- Mobile: dim backdrop behind the section modal -->
      <div
        v-if="!isDesktop && mobileSectionOpen"
        class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm"
        @click="closeMobileSection"
      />

      <main class="min-w-0" :class="activeTab === 'access' ? 'xl:flex xl:min-h-0 xl:flex-col' : ''">
      <Teleport to="body" :disabled="isDesktop">
        <div
          v-if="isDesktop || mobileSectionOpen"
          class="qs-card-soft overflow-hidden rounded-2xl sm:rounded-[22px]"
          :class="[
            activeTab === 'access' ? 'xl:flex xl:min-h-0 xl:flex-1 xl:flex-col' : '',
            !isDesktop ? 'safe-bottom fixed inset-x-3 inset-y-16 z-50 flex flex-col animate-slide-up' : '',
          ]"
        >
          <button
            v-if="!isDesktop"
            type="button"
            class="absolute right-3 top-3 z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80 text-slate-400 backdrop-blur transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
            @click="closeMobileSection"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>

          <div class="shrink-0 border-b border-slate-100 px-4 py-2.5" :class="!isDesktop ? 'pr-14' : ''">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">{{ activeTabMeta.kicker }}</p>
                <h2 class="mt-0.5 text-lg font-bold text-slate-950">{{ activeTabMeta.title }}</h2>
                <p class="mt-0.5 text-xs leading-5 text-slate-500">{{ activeTabMeta.detail }}</p>
              </div>
              <button
                class="owner-secondary-action !min-h-8 shrink-0 !rounded-xl !px-3 !py-1.5 !text-xs"
                @click="activeTab = 'branding'"
                v-if="activeTab !== 'branding' && activeTab !== 'access'"
              >
                Edit branding
              </button>
            </div>
          </div>

          <div
            class="flex-1 overflow-y-auto p-3"
            :class="[
              activeTab === 'access' ? 'xl:flex xl:min-h-0 xl:flex-1 xl:flex-col' : '',
              activeTab !== 'access' && !accessStore.can('settings.edit') ? 'pointer-events-none opacity-70' : '',
            ]"
          >
            <section v-show="activeTab === 'store'" class="space-y-2.5">
              <div class="grid gap-2.5 md:grid-cols-3">
                <label class="block">
                  <span class="admin-label">Store name</span>
                  <input v-model="tenant.name" type="text" placeholder="My Store" class="admin-input mt-2" />
                </label>
                <label class="block">
                  <span class="admin-label">Store contact phone</span>
                  <QePhoneInput v-model="tenant.phone" class="mt-2" />
                </label>
                <label class="block">
                  <span class="admin-label">Business type</span>
                  <QeSelect v-model="tenant.store_category" class="mt-2" :options="businessTypes" />
                </label>
                <div class="md:col-span-2">
                  <span class="admin-label block mb-2">Store location</span>
                  <LocationSearch
                    :model-value="tenant.address || ''"
                    placeholder="Search store location…"
                    @update:model-value="tenant.address = $event"
                    @select="onLocationSelect"
                  />
                </div>
                <label class="block">
                  <span class="admin-label">WhatsApp business</span>
                  <QePhoneInput v-model="tenant.whatsapp_number" class="mt-2" />
                </label>
              </div>

              <div class="rounded-xl border border-slate-100 bg-slate-50/55 p-2.5">
                <div class="mb-2 flex items-center gap-2.5">
                  <div class="owner-brand-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary ring-1">
                    <UserCircleIcon class="h-4 w-4" />
                  </div>
                  <div class="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <p class="text-sm font-bold text-slate-950">Your personal information</p>
                    <p class="text-[11px] text-slate-500">Dashboard account details</p>
                  </div>
                </div>
                <div class="grid gap-2.5 md:grid-cols-3">
                  <label class="block">
                    <span class="admin-label">Display name</span>
                    <input v-model="personal.name" type="text" maxlength="120" placeholder="Your full name" class="admin-input mt-2" />
                  </label>
                  <label class="block">
                    <span class="admin-label">Login email</span>
                    <input v-model="personal.email" type="email" maxlength="320" placeholder="you@example.com" class="admin-input mt-2" />
                  </label>
                  <label class="block">
                    <span class="admin-label">Login phone</span>
                    <QePhoneInput v-model="personal.phone" class="mt-2" />
                  </label>
                </div>
              </div>

            </section>

            <section v-show="activeTab === 'branding'" class="space-y-4">
              <div class="grid gap-3 lg:grid-cols-2">
                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <span class="admin-label">Store logo</span>
                    <span class="text-xs font-medium text-slate-400">Square works best</span>
                  </div>
                  <ImageUpload ref="logoRef" class="settings-upload" :model-value="tenant.logo_url || ''" @file-selected="f => uploadFile(f, 'logo')" />
                </div>
                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <span class="admin-label">Store banner</span>
                    <span class="text-xs font-medium text-slate-400">Up to 10MB</span>
                  </div>
                  <ImageUpload ref="bannerRef" class="settings-upload" :model-value="tenant.banner_url || ''" @file-selected="f => uploadFile(f, 'banner')" />
                </div>
              </div>

              <div class="grid gap-3 lg:grid-cols-2">
                <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <label class="admin-label">Primary color</label>
                  <ColorPicker v-model="tenant.primary_color" label="Primary color" class="settings-color mt-2" @update:model-value="applyPreview" />
                </div>
                <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <label class="admin-label">Accent color</label>
                  <ColorPicker v-model="tenant.accent_color" label="Accent color" class="settings-color mt-2" @update:model-value="applyPreview" />
                </div>
                <label class="block lg:col-span-2">
                  <span class="admin-label">Store font</span>
                  <QeSelect v-model="tenant.font_family" class="mt-2" :options="fontOptions" @change="applyPreview" />
                  <p v-if="tenant.font_family === 'Segoe UI'" class="mt-1.5 text-[11px] font-medium text-slate-400">
                    Uses Segoe UI on supported devices and the closest system font elsewhere.
                  </p>
                </label>
              </div>
            </section>

            <section v-show="activeTab === 'delivery'" class="space-y-4">
              <div class="grid gap-3 lg:grid-cols-2">
                <button
                  type="button"
                  @click="storeSettings.delivery_enabled = !storeSettings.delivery_enabled"
                  :class="[
                    'rounded-2xl border p-3 text-left transition',
                    storeSettings.delivery_enabled
                      ? 'owner-brand-selected'
                      : 'border-slate-100 bg-white'
                  ]"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <TruckIcon class="h-4 w-4" />
                    </span>
                    <span class="qs-toggle" :class="storeSettings.delivery_enabled ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="storeSettings.delivery_enabled ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">Delivery</p>
                  <p class="mt-0.5 text-xs leading-5 text-slate-500">Let customers place orders for rider dispatch.</p>
                </button>

                <button
                  type="button"
                  @click="storeSettings.pickup_enabled = !storeSettings.pickup_enabled"
                  :class="[
                    'rounded-2xl border p-3 text-left transition',
                    storeSettings.pickup_enabled
                      ? 'owner-brand-selected'
                      : 'border-slate-100 bg-white'
                  ]"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <ShoppingBagIcon class="h-4 w-4" />
                    </span>
                    <span class="qs-toggle" :class="storeSettings.pickup_enabled ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="storeSettings.pickup_enabled ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">Pickup</p>
                  <p class="mt-0.5 text-xs leading-5 text-slate-500">Allow customers to collect from your store.</p>
                </button>
              </div>

              <div class="grid gap-3 lg:grid-cols-2">
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

            <section v-show="activeTab === 'prefs'" class="space-y-4">
              <div class="grid gap-3 lg:grid-cols-2">
                <button
                  type="button"
                  class="owner-brand-hover rounded-2xl border border-slate-100 bg-white p-3 text-left transition"
                  @click="settingsStore.toggleDarkMode()"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                      <MoonIcon v-if="settingsStore.darkMode" class="h-4 w-4" />
                      <SunIcon v-else class="h-4 w-4" />
                    </span>
                    <span class="qs-toggle" :class="settingsStore.darkMode ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="settingsStore.darkMode ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-bold text-slate-950">Dark mode</p>
                  <p class="mt-0.5 text-xs leading-5 text-slate-500">Switch the owner dashboard theme.</p>
                </button>

                <div class="rounded-2xl border border-slate-100 bg-white p-3">
                  <p class="text-sm font-bold text-slate-950">Order view</p>
                  <p class="mt-0.5 text-xs text-slate-500">Choose how orders open by default.</p>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      @click="settingsStore.setOrderView('kanban')"
                      :class="[
                        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition',
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
                        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition',
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

              <div class="grid gap-3 lg:grid-cols-2">
                <label class="block">
                  <span class="admin-label">Language</span>
                  <QeSelect v-model="storeSettings.language" class="mt-2" :options="languageOptions" />
                </label>
                <button
                  type="button"
                  class="owner-brand-hover rounded-2xl border border-slate-100 bg-white p-3 text-left transition"
                  @click="settingsStore.toggleSound()"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span>
                      <span class="block text-sm font-bold text-slate-950">Notification sounds</span>
                      <span class="mt-0.5 block text-xs text-slate-500">Play alerts for new activity.</span>
                    </span>
                    <span class="qs-toggle" :class="settingsStore.soundEnabled ? 'bg-primary' : 'bg-slate-200'">
                      <span class="qs-toggle-thumb" :class="settingsStore.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'" />
                    </span>
                  </div>
                </button>
              </div>
            </section>
            <section v-if="activeTab === 'access'" class="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
              <UsersAccessPanel />
            </section>
          </div>

          <div v-if="!isDesktop && activeTab !== 'access'" class="safe-bottom shrink-0 border-t border-slate-100 bg-white/95 p-3">
            <button
              @click="saveAll"
              :disabled="settingsStore.saving"
              class="owner-primary-action w-full justify-center"
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
      </Teleport>
      </main>

      <aside v-show="activeTab !== 'access'" class="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <div class="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
          <EyeIcon class="h-4 w-4" />
          Storefront preview
        </div>

        <div class="qs-card-soft overflow-hidden rounded-[22px]">
          <div class="owner-brand-surface relative h-36 overflow-hidden">
            <img
              :src="tenant.banner_url || '/qesuite-marketplace-reference.png'"
              alt=""
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/20" />
            <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            <div class="absolute left-4 top-4 flex items-start gap-2.5">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white text-xl font-black text-primary shadow-lg">
                <img v-if="tenant.logo_url" :src="tenant.logo_url" alt="" class="h-full w-full object-cover" />
                <span v-else>{{ storeInitial }}</span>
              </div>
              <div class="min-w-0 pt-1">
                <p class="truncate text-base font-black text-slate-950" :style="{ fontFamily: storeFontStack(tenant.font_family) }">
                  {{ tenant.name || 'Your Store' }}
                </p>
                <p class="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-slate-600">
                  Fresh shopping, easy checkout, quick delivery.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3 p-4">
            <div class="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span class="owner-brand-surface rounded-full px-3 py-1.5 text-primary">Open</span>
              <span>{{ storeSettings.estimated_delivery_minutes }} min</span>
              <span class="h-1 w-1 rounded-full bg-primary" />
              <span v-if="storeSettings.delivery_enabled">Delivery</span>
              <span v-if="storeSettings.pickup_enabled">Pickup</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div v-for="item in previewItems" :key="item.name" class="rounded-xl border border-slate-100 bg-slate-50/80 p-2">
                <div class="mb-2 flex h-9 items-center justify-center rounded-xl bg-white text-xs font-black text-primary shadow-sm">
                  {{ item.badge }}
                </div>
                <p class="truncate text-xs font-bold text-slate-700">{{ item.name }}</p>
                <p class="mt-1 text-xs font-black text-primary">KES {{ item.price }}</p>
              </div>
            </div>

            <div class="owner-brand-surface rounded-xl border p-2.5">
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon,
  CheckIcon,
  EyeIcon,
  ListBulletIcon,
  MoonIcon,
  PaintBrushIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  SunIcon,
  TruckIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { QeSelect, QePhoneInput } from '@qesuite/ui'
import ImageUpload from '@/components/dashboard/ImageUpload.vue'
import ColorPicker from '@/components/dashboard/ColorPicker.vue'
import LocationSearch from '@/components/dashboard/LocationSearch.vue'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useAccessStore } from '@/stores/access'
import UsersAccessPanel from '@/components/dashboard/UsersAccessPanel.vue'
import { apiGetUploadUrl } from '@/api/settings'
import { beginNetworkActivity, endNetworkActivity } from '@/composables/useNetworkActivity'
import type { Language, StoreCategory } from '@qesuite/types'
import { STORE_FONTS, storeFontStack } from '@qesuite/shared'
import { useToast } from '@/composables/useToast'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const accessStore = useAccessStore()
const { showToast } = useToast()
const fonts = STORE_FONTS
const fontOptions = computed(() =>
  fonts.map((font) => ({ value: font, label: font, style: { fontFamily: storeFontStack(font) } }))
)
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'sw', label: 'Swahili' },
]

// Mirrors the category list offered during onboarding (StoreIdentityStep.vue) so an
// owner can revisit and change their business type at any time after signup.
const businessTypes: { value: StoreCategory; label: string }[] = [
  { value: 'groceries',   label: 'Groceries & Supermarket' },
  { value: 'food',        label: 'Food & Restaurants' },
  { value: 'fashion',     label: 'Fashion & Clothing' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'pharmacy',    label: 'Pharmacy & Health' },
  { value: 'beauty',      label: 'Beauty & Personal Care' },
  { value: 'home',        label: 'Home & Living' },
  { value: 'sports',      label: 'Sports & Fitness' },
  { value: 'other',       label: 'Other' },
]
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
  },
  {
    id: 'access',
    label: 'Users & Access',
    description: 'Staff, menus, operations',
    title: 'Users and access',
    kicker: 'Authorization',
    detail: 'Control exactly which menus and operations each store user can access.',
    icon: UsersIcon
  }
] as const

type TabId = typeof tabs[number]['id']

const activeTab = ref<TabId>('store')
const visibleTabs = computed(() => tabs.filter(tab => tab.id !== 'access' || authStore.role === 'owner'))

// Below xl, sections open as a modal (tapped from a tile grid) instead of
// swapping inline next to a sidebar — there's no room for both on mobile.
const DESKTOP_QUERY = '(min-width: 1280px)'
const desktopMedia = window.matchMedia(DESKTOP_QUERY)
const isDesktop = ref(desktopMedia.matches)
const mobileSectionOpen = ref(false)

function onDesktopMediaChange(e: MediaQueryListEvent) {
  isDesktop.value = e.matches
}

function openMobileSection(tabId: TabId) {
  activeTab.value = tabId
  mobileSectionOpen.value = true
}

function closeMobileSection() {
  mobileSectionOpen.value = false
}

const tenant = reactive({
  name: settingsStore.tenant?.name ?? '',
  phone: settingsStore.tenant?.phone ?? '',
  store_category: (settingsStore.tenant?.store_category ?? 'other') as StoreCategory,
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

const personal = reactive({
  name: authStore.user?.name ?? '',
  email: authStore.user?.email ?? '',
  phone: authStore.user?.phone ?? ''
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
  tenant.store_category = t.store_category ?? 'other'
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

watch(() => authStore.user, (u) => {
  if (!u) return
  personal.name = u.name
  personal.email = u.email ?? ''
  personal.phone = u.phone ?? ''
}, { immediate: true })

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
  document.documentElement.style.setProperty('--font-family', storeFontStack(tenant.font_family))
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
  const displayName = personal.name.trim()
  const email = personal.email.trim()
  const phone = personal.phone.trim()
  if (!displayName) {
    showToast('Enter your display name', 'error')
    return
  }
  if (!email && !phone) {
    showToast('Keep either an email address or phone number for login', 'error')
    return
  }

  try {
    await Promise.all([
      settingsStore.updateTenant({
        name: tenant.name,
        phone: tenant.phone || null,
        store_category: tenant.store_category,
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
      }),
      authStore.updateProfile({ name: displayName, email, phone })
    ])
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to save personal information', 'error')
  }
}

onMounted(async () => {
  // Fetch fresh data from the server; the watches above sync the form reactively
  await Promise.all([settingsStore.fetchTenant(), settingsStore.fetchStoreSettings(), authStore.fetchMe()])
  desktopMedia.addEventListener('change', onDesktopMediaChange)
})

onUnmounted(() => {
  desktopMedia.removeEventListener('change', onDesktopMediaChange)
})
</script>

<style scoped>
.settings-dense :deep(.admin-input) {
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.125rem;
}

.settings-dense :deep(.admin-input.mt-2) {
  margin-top: 0.25rem;
}

.settings-dense :deep(.admin-label) {
  margin-bottom: 0.125rem;
  font-size: 0.6875rem;
}

.settings-dense :deep(.settings-upload > div:first-child) {
  min-height: 5.5rem;
}

.settings-dense :deep(.settings-upload .p-4) {
  padding: 0.625rem;
}

.settings-dense :deep(.settings-upload .h-10) {
  height: 1.75rem;
}

.settings-dense :deep(.settings-upload .w-10) {
  width: 1.75rem;
}

.settings-dense :deep(.settings-color) {
  gap: 0.5rem;
}

.settings-dense :deep(.settings-color input[type='color']) {
  width: 2.25rem;
  height: 2.25rem;
}

.settings-dense :deep(.settings-color input[type='text']) {
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
}

.settings-dense :deep(.settings-color > div:last-child) {
  width: 1.75rem;
  height: 1.75rem;
}
</style>
