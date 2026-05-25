<template>
  <div class="p-3 sm:p-4 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <h2 class="text-base font-bold text-gray-900 dark:text-white">Settings</h2>
      <button
        @click="saveAll"
        :disabled="settingsStore.saving"
        class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-primary/20"
      >
        <svg v-if="settingsStore.saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <CheckIcon v-else class="w-4 h-4" />
        Save Changes
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 overflow-x-auto pb-1 mb-4 border-b border-gray-100 dark:border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-3 py-2 text-xs font-medium whitespace-nowrap transition-all rounded-t-lg -mb-px',
          activeTab === tab.id
            ? 'text-primary border-b-2 border-primary bg-primary/5'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <!-- Form area -->
      <div class="xl:col-span-3 space-y-4">
        <!-- STORE INFO -->
        <div v-show="activeTab === 'store'">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Store Information</h3>
          <div class="space-y-3">
            <div>
              <label class="qs-label">Store Name</label>
              <input v-model="tenant.name" type="text" placeholder="My Store" class="qs-input" />
            </div>
            <div>
              <label class="qs-label">Phone</label>
              <input v-model="tenant.phone" type="tel" placeholder="+254700000000" class="qs-input" />
            </div>
            <div>
              <label class="qs-label">Address</label>
              <input v-model="tenant.address" type="text" placeholder="123 Main St, Nairobi" class="qs-input" />
            </div>
            <div>
              <label class="qs-label">WhatsApp Business</label>
              <input v-model="tenant.whatsapp_number" type="tel" placeholder="+254700000000" class="qs-input" />
            </div>
          </div>
        </div>

        <!-- BRANDING -->
        <div v-show="activeTab === 'branding'">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Branding</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="qs-label">Logo</label>
                <ImageUpload ref="logoRef" :model-value="tenant.logo_url || ''" @file-selected="f => uploadFile(f, 'logo')" />
              </div>
              <div>
                <label class="qs-label">Banner</label>
                <ImageUpload ref="bannerRef" :model-value="tenant.banner_url || ''" @file-selected="f => uploadFile(f, 'banner')" />
              </div>
            </div>
            <div>
              <label class="qs-label">Primary Color</label>
              <ColorPicker v-model="tenant.primary_color" @update:model-value="applyPreview" />
            </div>
            <div>
              <label class="qs-label">Accent Color</label>
              <ColorPicker v-model="tenant.accent_color" @update:model-value="applyPreview" />
            </div>
            <div>
              <label class="qs-label">Font</label>
              <select v-model="tenant.font_family" @change="applyPreview" class="qs-input">
                <option v-for="f in fonts" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- DELIVERY -->
        <div v-show="activeTab === 'delivery'">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Delivery Settings</h3>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Delivery</p>
                <p class="text-xs text-gray-400">Accept delivery orders</p>
              </div>
              <button @click="storeSettings.delivery_enabled = !storeSettings.delivery_enabled" class="qs-toggle" :class="storeSettings.delivery_enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'">
                <span class="qs-toggle-thumb" :class="storeSettings.delivery_enabled ? 'translate-x-5' : 'translate-x-0.5'" />
              </button>
            </div>
            <div class="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Pickup</p>
                <p class="text-xs text-gray-400">Accept pickup orders</p>
              </div>
              <button @click="storeSettings.pickup_enabled = !storeSettings.pickup_enabled" class="qs-toggle" :class="storeSettings.pickup_enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'">
                <span class="qs-toggle-thumb" :class="storeSettings.pickup_enabled ? 'translate-x-5' : 'translate-x-0.5'" />
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="qs-label">Delivery Fee (KES)</label>
                <input v-model.number="storeSettings.delivery_fee" type="number" min="0" class="qs-input" />
              </div>
              <div>
                <label class="qs-label">Radius (km)</label>
                <input v-model.number="storeSettings.delivery_radius_km" type="number" min="1" class="qs-input" />
              </div>
              <div>
                <label class="qs-label">Est. Time (min)</label>
                <input v-model.number="storeSettings.estimated_delivery_minutes" type="number" min="5" class="qs-input" />
              </div>
              <div>
                <label class="qs-label">Min Order (KES)</label>
                <input v-model.number="storeSettings.min_order_amount" type="number" min="0" class="qs-input" />
              </div>
            </div>
          </div>
        </div>

        <!-- PREFERENCES -->
        <div v-show="activeTab === 'prefs'">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Preferences</h3>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
                <p class="text-xs text-gray-400">Use dark theme</p>
              </div>
              <button @click="settingsStore.toggleDarkMode()" class="qs-toggle" :class="settingsStore.darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'">
                <span class="qs-toggle-thumb" :class="settingsStore.darkMode ? 'translate-x-5' : 'translate-x-0.5'" />
              </button>
            </div>
            <div class="px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Order View</p>
              <div class="flex gap-1.5">
                <button @click="settingsStore.setOrderView('kanban')"
                  :class="['flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors', settingsStore.orderView === 'kanban' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400']">
                  Kanban
                </button>
                <button @click="settingsStore.setOrderView('list')"
                  :class="['flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors', settingsStore.orderView === 'list' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400']">
                  List
                </button>
              </div>
            </div>
            <div class="px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Language</p>
              <select v-model="storeSettings.language" class="qs-input">
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview panel -->
      <div class="xl:col-span-2 hidden xl:block">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
          <EyeIcon class="w-4 h-4" /> Storefront Preview
        </p>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-900">
          <div class="h-24 relative flex items-end p-3" :style="{ backgroundColor: previewPrimary }">
            <img v-if="tenant.banner_url" :src="tenant.banner_url" class="absolute inset-0 w-full h-full object-cover" />
            <div class="relative z-10 flex items-center gap-2">
              <div v-if="!tenant.logo_url" class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold">
                {{ (tenant.name || 'S')[0] }}
              </div>
              <img v-else :src="tenant.logo_url" class="w-10 h-10 rounded-xl object-cover border-2 border-white/40" />
              <div>
                <p class="text-white font-semibold text-xs" :style="{ fontFamily: tenant.font_family }">{{ tenant.name || 'Your Store' }}</p>
                <p class="text-white/70 text-xs">{{ tenant.address || 'Your address' }}</p>
              </div>
            </div>
          </div>
          <div class="p-3">
            <div class="grid grid-cols-2 gap-2">
              <div v-for="i in 4" :key="i" class="bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                <div class="w-full h-14 bg-gray-200 dark:bg-gray-700 rounded-lg mb-1.5" />
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                <div class="h-2 rounded w-1/2" :style="{ backgroundColor: previewAccent }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { CheckIcon, EyeIcon } from '@heroicons/vue/24/outline'
import ImageUpload from '@/components/dashboard/ImageUpload.vue'
import ColorPicker from '@/components/dashboard/ColorPicker.vue'
import { useSettingsStore } from '@/stores/settings'
import { apiGetUploadUrl } from '@/api/settings'
import type { Language } from '@qesuite/types'

const settingsStore = useSettingsStore()
const fonts = ['Inter', 'Poppins', 'DM Sans', 'Nunito']
const logoRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const bannerRef = ref<InstanceType<typeof ImageUpload> | null>(null)

const tabs = [
  { id: 'store', label: 'Store Info' },
  { id: 'branding', label: 'Branding' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'prefs', label: 'Preferences' },
]
const activeTab = ref('store')

const tenant = reactive({
  name: '',
  phone: '',
  address: '',
  whatsapp_number: '',
  logo_url: null as string | null,
  banner_url: null as string | null,
  primary_color: '#10b981',
  accent_color: '#0d9488',
  font_family: 'Inter'
})

const storeSettings = reactive({
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee: 150,
  delivery_radius_km: 10,
  estimated_delivery_minutes: 30,
  min_order_amount: 0,
  language: 'en' as Language
})

const previewPrimary = ref(tenant.primary_color)
const previewAccent = ref(tenant.accent_color)

function applyPreview() {
  previewPrimary.value = tenant.primary_color
  previewAccent.value = tenant.accent_color
}

async function uploadFile(file: File, type: 'logo' | 'banner') {
  const ref = type === 'logo' ? logoRef.value : bannerRef.value
  try {
    const presignRes = await apiGetUploadUrl(file.name, file.type)
    if (!presignRes.success || !presignRes.data) return
    const { upload_url, public_url } = presignRes.data

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable && ref) ref.setProgress(Math.round(e.loaded / e.total * 100))
      })
      xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject())
      xhr.addEventListener('error', reject)
      xhr.open('PUT', upload_url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    if (type === 'logo') tenant.logo_url = public_url
    else tenant.banner_url = public_url
    ref?.setPreview(public_url)
  } catch { /* ignore */ }
}

async function saveAll() {
  await Promise.all([
    settingsStore.updateTenant({
      name: tenant.name,
      phone: tenant.phone || null,
      address: tenant.address || null,
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
      language: storeSettings.language
    })
  ])
}

onMounted(async () => {
  await Promise.all([settingsStore.fetchTenant(), settingsStore.fetchStoreSettings()])
  if (settingsStore.tenant) {
    tenant.name = settingsStore.tenant.name
    tenant.phone = settingsStore.tenant.phone || ''
    tenant.address = settingsStore.tenant.address || ''
    tenant.whatsapp_number = settingsStore.tenant.whatsapp_number || ''
    tenant.logo_url = settingsStore.tenant.logo_url
    tenant.banner_url = settingsStore.tenant.banner_url
    tenant.primary_color = settingsStore.tenant.primary_color
    tenant.accent_color = settingsStore.tenant.accent_color
    tenant.font_family = settingsStore.tenant.font_family
    previewPrimary.value = tenant.primary_color
    previewAccent.value = tenant.accent_color
  }
  if (settingsStore.storeSettings) {
    storeSettings.delivery_enabled = settingsStore.storeSettings.delivery_enabled
    storeSettings.pickup_enabled = settingsStore.storeSettings.pickup_enabled
    storeSettings.delivery_fee = settingsStore.storeSettings.delivery_fee
    storeSettings.delivery_radius_km = settingsStore.storeSettings.delivery_radius_km
    storeSettings.estimated_delivery_minutes = settingsStore.storeSettings.estimated_delivery_minutes
    storeSettings.min_order_amount = settingsStore.storeSettings.min_order_amount
    storeSettings.language = settingsStore.storeSettings.language
  }
})
</script>
