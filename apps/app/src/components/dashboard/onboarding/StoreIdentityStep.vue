<template>
  <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
    <div class="space-y-5">
      <section class="qs-card-soft p-4 sm:p-5">
        <div class="mb-4">
          <h3 class="text-base font-extrabold text-slate-950">Store basics</h3>
          <p class="text-sm font-medium text-slate-500">Name, category, and storefront address.</p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="admin-label">Store Name *</label>
            <input v-model="form.name" type="text" placeholder="My Awesome Store" required @input="generateSlug" class="admin-input" />
          </div>

          <div class="sm:col-span-2">
            <label class="admin-label">Store URL Slug *</label>
            <div class="flex min-w-0 items-center">
              <span class="hidden h-10 items-center rounded-l-xl border border-r-0 border-[#d0daca] bg-emerald-50/70 px-3 text-xs font-bold text-emerald-800 sm:inline-flex">{{ storefrontHost }}/</span>
              <div class="relative flex-1">
                <input
                  v-model="form.slug"
                  type="text"
                  placeholder="my-store"
                  @input="checkSlug"
                  :class="[
                    'admin-input font-mono sm:rounded-l-none',
                    slugStatus === 'taken' ? 'border-red-400' : '',
                    slugStatus === 'available' ? 'border-emerald-400' : ''
                  ]"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg v-if="slugChecking" class="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <CheckCircleIcon v-else-if="slugStatus === 'available'" class="h-4 w-4 text-emerald-600" />
                  <XCircleIcon v-else-if="slugStatus === 'taken'" class="h-4 w-4 text-red-500" />
                </div>
              </div>
            </div>
            <p v-if="slugStatus === 'available'" class="mt-1 text-xs font-semibold text-emerald-700">Available</p>
            <p v-else-if="slugStatus === 'taken'" class="mt-1 text-xs font-semibold text-red-500">This URL is already taken.</p>
          </div>

          <div class="sm:col-span-2">
            <label class="admin-label">Store Category</label>
            <select v-model="form.store_category" class="admin-input">
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
            </select>
          </div>
        </div>
      </section>

      <section class="qs-card-soft p-4 sm:p-5">
        <div class="mb-4">
          <h3 class="text-base font-extrabold text-slate-950">Visual identity</h3>
          <p class="text-sm font-medium text-slate-500">Upload brand assets and choose colors.</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="admin-label">Store Banner</label>
            <ImageUpload ref="bannerUploadRef" :model-value="form.banner_url" @file-selected="uploadBanner" class="w-full" />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <label class="admin-label">Store Logo</label>
              <ImageUpload ref="logoUploadRef" :model-value="form.logo_url" @file-selected="uploadLogo" />
            </div>
            <div class="grid gap-3">
              <div>
                <label class="admin-label">Primary Color</label>
                <ColorPicker v-model="form.primary_color" label="Primary color" />
              </div>
              <div>
                <label class="admin-label">Accent Color</label>
                <ColorPicker v-model="form.accent_color" label="Accent color" />
              </div>
            </div>
          </div>

          <div>
            <label class="admin-label">Font</label>
            <select v-model="form.font_family" class="admin-input">
              <option v-for="font in fonts" :key="font" :value="font" :style="{ fontFamily: font }">{{ font }}</option>
            </select>
          </div>
        </div>
      </section>

      <section class="qs-card-soft p-4 sm:p-5">
        <div class="mb-4">
          <h3 class="text-base font-extrabold text-slate-950">Contact details</h3>
          <p class="text-sm font-medium text-slate-500">Where customers can reach or find you.</p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="admin-label">Phone</label>
            <input v-model="form.phone" type="tel" placeholder="+254700000000" class="admin-input" />
          </div>
          <div class="sm:col-span-2">
            <label class="admin-label">Store Location</label>
            <p class="mb-1.5 text-xs font-medium text-slate-400">Search and select the exact location so customers can find you on the map.</p>
            <LocationSearch
              :model-value="form.address"
              placeholder="Search your store location…"
              @update:model-value="form.address = $event"
              @select="onLocationSelect"
            />
          </div>
        </div>
      </section>
    </div>

    <aside class="xl:sticky xl:top-5 xl:self-start">
      <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-600">
        <EyeIcon class="h-4 w-4" /> Store preview
      </p>
      <div class="overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.035)]">
        <div class="relative h-36 overflow-hidden bg-emerald-50" :style="{ backgroundColor: form.primary_color }">
          <img v-if="form.banner_url" :src="form.banner_url" class="absolute inset-0 h-full w-full object-cover" />
          <img v-else src="/qesuite-marketplace-reference.png" class="absolute inset-0 h-full w-full object-cover opacity-90" />
          <div class="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
        </div>
        <div class="relative px-4 pb-4">
          <div class="-mt-10 flex items-end gap-3">
            <div class="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.10)]">
              <img v-if="form.logo_url" :src="form.logo_url" class="h-full w-full object-cover" />
              <span v-else class="text-2xl font-extrabold text-emerald-700">{{ (form.name || 'S')[0].toUpperCase() }}</span>
            </div>
            <div class="min-w-0 pb-1">
              <p class="truncate text-lg font-extrabold text-slate-950" :style="{ fontFamily: form.font_family }">{{ form.name || 'My Store' }}</p>
              <p class="truncate text-sm font-medium text-slate-500">{{ form.address || 'Store address' }}</p>
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <span class="rounded-full px-3 py-1.5 text-xs font-extrabold text-white" :style="{ backgroundColor: form.primary_color }">All Products</span>
            <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-500">Featured</span>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="rounded-2xl border border-slate-100 bg-slate-50 p-2">
              <div class="h-20 rounded-xl bg-white"></div>
              <div class="mt-2 h-2.5 w-3/4 rounded-full bg-slate-200"></div>
              <div class="mt-2 h-2.5 w-1/2 rounded-full" :style="{ backgroundColor: form.accent_color }"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/vue/24/outline'
import ImageUpload from '@/components/dashboard/ImageUpload.vue'
import ColorPicker from '@/components/dashboard/ColorPicker.vue'
import LocationSearch from '@/components/dashboard/LocationSearch.vue'
import { apiCheckSlug, apiGetUploadUrl } from '@/api/settings'
import { beginNetworkActivity, endNetworkActivity } from '@/composables/useNetworkActivity'

const fonts = ['Inter', 'Poppins', 'DM Sans', 'Nunito']

const categories = [
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

// Show just the hostname portion so the slug input label stays compact
const storefrontHost = computed(() => {
  const url = import.meta.env.VITE_STOREFRONT_URL || window.location.origin
  try { return new URL(url).host } catch { return url }
})

const form = defineModel<{
  name: string
  slug: string
  store_category: string
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  accent_color: string
  font_family: string
  phone: string
  address: string
  lat: number | null
  lng: number | null
}>({ required: true })

function onLocationSelect(payload: { address: string; lat: number; lng: number }) {
  form.value.address = payload.address
  form.value.lat = payload.lat || null
  form.value.lng = payload.lng || null
}

const logoUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const bannerUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const slugChecking = ref(false)
const slugStatus = ref<'idle' | 'available' | 'taken'>('idle')
let slugTimer: ReturnType<typeof setTimeout>

function generateSlug() {
  if (!form.value.name) return
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  checkSlug()
}

async function checkSlug() {
  const slug = form.value.slug
  if (!slug || slug.length < 3) { slugStatus.value = 'idle'; return }
  clearTimeout(slugTimer)
  slugStatus.value = 'idle'
  slugChecking.value = true
  slugTimer = setTimeout(async () => {
    try {
      const res = await apiCheckSlug(slug)
      slugStatus.value = res.data?.available ? 'available' : 'taken'
    } catch {
      slugStatus.value = 'idle'
    } finally {
      slugChecking.value = false
    }
  }, 500)
}

async function uploadFile(file: File, ref: InstanceType<typeof ImageUpload> | null, purpose: 'logo' | 'banner' = 'logo'): Promise<string | null> {
  if (!ref) return null
  const activity = beginNetworkActivity('Uploading brand image')
  try {
    const presignRes = await apiGetUploadUrl(file.name, file.type, purpose)
    if (!presignRes.success || !presignRes.data) return null
    const { upload_url, public_url } = presignRes.data

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) ref.setProgress(Math.round(e.loaded / e.total * 100))
      })
      xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject())
      xhr.addEventListener('error', reject)
      xhr.open('PUT', upload_url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    ref.setPreview(public_url)
    return public_url
  } catch {
    return null
  } finally {
    endNetworkActivity(activity)
  }
}

async function uploadLogo(file: File) {
  const url = await uploadFile(file, logoUploadRef.value, 'logo')
  if (url) form.value.logo_url = url
}

async function uploadBanner(file: File) {
  const url = await uploadFile(file, bannerUploadRef.value, 'banner')
  if (url) form.value.banner_url = url
}

watch(() => form.value.slug, (newVal) => {
  if (newVal && newVal.length >= 3) {
    checkSlug()
  } else {
    slugStatus.value = 'idle'
  }
})
</script>
