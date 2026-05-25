<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
    <!-- Form -->
    <div class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name *</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="My Awesome Store"
          required
          @input="generateSlug"
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store URL Slug *</label>
        <div class="flex items-center gap-0">
          <span class="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs border border-r-0 border-gray-200 dark:border-gray-600 rounded-l-lg">qesuite.store/</span>
          <div class="flex-1 relative">
            <input
              v-model="form.slug"
              type="text"
              placeholder="my-store"
              @input="checkSlug"
              :class="['w-full px-3 py-2 border-y border-r bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-r-lg transition-all',
                slugStatus === 'taken' ? 'border-red-400 dark:border-red-500' :
                slugStatus === 'available' ? 'border-emerald-400 dark:border-emerald-500' :
                'border-gray-200 dark:border-gray-600 focus:border-primary']"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <svg v-if="slugChecking" class="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <CheckCircleIcon v-else-if="slugStatus === 'available'" class="w-4 h-4 text-emerald-500" />
              <XCircleIcon v-else-if="slugStatus === 'taken'" class="w-4 h-4 text-red-500" />
            </div>
          </div>
        </div>
        <p v-if="slugStatus === 'available'" class="text-emerald-600 dark:text-emerald-400 text-xs mt-1">Available!</p>
        <p v-else-if="slugStatus === 'taken'" class="text-red-500 text-xs mt-1">This URL is already taken.</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Logo</label>
          <ImageUpload
            ref="logoUploadRef"
            :model-value="form.logo_url"
            @file-selected="uploadLogo"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Banner</label>
          <ImageUpload
            ref="bannerUploadRef"
            :model-value="form.banner_url"
            @file-selected="uploadBanner"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Color</label>
          <ColorPicker v-model="form.primary_color" label="Primary color" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Accent Color</label>
          <ColorPicker v-model="form.accent_color" label="Accent color" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Font</label>
          <select
            v-model="form.font_family"
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          >
            <option v-for="font in fonts" :key="font" :value="font" :style="{ fontFamily: font }">{{ font }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="+254700000000"
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
        <input
          v-model="form.address"
          type="text"
          placeholder="123 Main Street, Nairobi"
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>
    </div>

    <!-- Live Preview -->
    <div class="hidden xl:block">
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
        <EyeIcon class="w-4 h-4" /> Live Preview
      </p>
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg">
        <!-- Banner -->
        <div
          class="h-28 relative flex items-end p-4"
          :style="{ backgroundColor: form.primary_color }"
        >
          <img v-if="form.banner_url" :src="form.banner_url" class="absolute inset-0 w-full h-full object-cover" />
          <div class="relative z-10 flex items-center gap-3">
            <div
              v-if="!form.logo_url"
              class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            >
              {{ (form.name || 'S')[0].toUpperCase() }}
            </div>
            <img v-else :src="form.logo_url" class="w-12 h-12 rounded-xl object-cover border-2 border-white/40" />
            <div>
              <p class="text-white font-semibold text-sm" :style="{ fontFamily: form.font_family }">{{ form.name || 'My Store' }}</p>
              <p class="text-white/70 text-xs">{{ form.address || 'Your address here' }}</p>
            </div>
          </div>
        </div>
        <!-- Sample content -->
        <div class="bg-white dark:bg-gray-900 p-4">
          <div class="flex gap-2 overflow-x-auto pb-2 mb-4">
            <div
              v-for="cat in ['All', 'Featured', 'New']" :key="cat"
              :class="['px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all', cat === 'All' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400']"
              :style="cat === 'All' ? { backgroundColor: form.primary_color } : {}"
            >{{ cat }}</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div class="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
              <div
                class="h-3 rounded w-1/2 text-white text-xs"
                :style="{ backgroundColor: form.accent_color }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/vue/24/outline'
import ImageUpload from '@/components/dashboard/ImageUpload.vue'
import ColorPicker from '@/components/dashboard/ColorPicker.vue'
import { apiCheckSlug, apiGetUploadUrl } from '@/api/settings'

const fonts = ['Inter', 'Poppins', 'DM Sans', 'Nunito']

const form = defineModel<{
  name: string
  slug: string
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  accent_color: string
  font_family: string
  phone: string
  address: string
}>({ required: true })

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

async function uploadFile(file: File, ref: InstanceType<typeof ImageUpload> | null): Promise<string | null> {
  if (!ref) return null
  try {
    const presignRes = await apiGetUploadUrl(file.name, file.type)
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
  }
}

async function uploadLogo(file: File) {
  const url = await uploadFile(file, logoUploadRef.value)
  if (url) form.value.logo_url = url
}

async function uploadBanner(file: File) {
  const url = await uploadFile(file, bannerUploadRef.value)
  if (url) form.value.banner_url = url
}
</script>
