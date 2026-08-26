<template>
  <div class="relative">
    <div class="relative">
      <MapPinIcon class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
        class="admin-input !pl-9 !pr-9"
        @input="onInput"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="close"
        @blur="onBlur"
      />
      <div class="absolute right-3 top-1/2 -translate-y-1/2">
        <svg v-if="loading" class="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <button
          v-else-if="query"
          type="button"
          tabindex="-1"
          class="text-slate-400 hover:text-slate-600"
          @mousedown.prevent="clear"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Dropdown: Google Places results -->
    <ul
      v-if="open && googleMode && googleResults.length"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1 shadow-2xl"
    >
      <li
        v-for="(r, i) in googleResults"
        :key="r.place_id"
        :class="['flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors', highlighted === i ? 'bg-emerald-50' : 'hover:bg-slate-50']"
        @mousedown.prevent="selectGoogle(r)"
      >
        <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div class="min-w-0">
          <p class="font-semibold leading-tight text-slate-900">{{ r.structured_formatting.main_text }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-400">{{ r.structured_formatting.secondary_text }}</p>
        </div>
      </li>
      <li class="px-4 py-1 text-right text-[10px] text-slate-300">Powered by Google</li>
    </ul>

    <!-- Dropdown: Nominatim fallback results -->
    <ul
      v-else-if="open && !googleMode && results.length"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1 shadow-2xl"
    >
      <li
        v-for="(r, i) in results"
        :key="r.place_id"
        :class="['flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors', highlighted === i ? 'bg-emerald-50' : 'hover:bg-slate-50']"
        @mousedown.prevent="select(r)"
      >
        <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div class="min-w-0">
          <p class="font-semibold leading-tight text-slate-900">{{ primaryLabel(r) }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-400">{{ secondaryLabel(r) }}</p>
        </div>
      </li>
    </ul>

    <!-- No results -->
    <div
      v-else-if="open && searched && !loading && !googleResults.length && !results.length"
      class="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-2xl text-center"
    >
      <p class="text-sm text-slate-500">No results for "<span class="font-semibold">{{ query }}</span>"</p>
      <p class="mt-1 text-xs text-slate-400">Type more or use this address as-is</p>
      <button
        class="mt-3 w-full rounded-xl bg-emerald-700 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
        @mousedown.prevent="useAsTyped"
      >
        Use "{{ query }}"
      </button>
    </div>

    <!-- Confirmed selection chip -->
    <p v-if="confirmedAddress && !open" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <CheckCircleIcon class="h-3.5 w-3.5 shrink-0" />
      Location pinned
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircleIcon, MapPinIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import api from '@/api/index'

interface GooglePrediction {
  place_id: string
  description: string
  structured_formatting: { main_text: string; secondary_text?: string }
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string; suburb?: string; neighbourhood?: string
    city?: string; county?: string; state?: string; country?: string
  }
}

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Search store location…',
})

const emit = defineEmits<{
  'update:modelValue': [address: string]
  'select': [payload: { address: string; lat: number; lng: number }]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref(props.modelValue)
const results = ref<NominatimResult[]>([])
const googleResults = ref<GooglePrediction[]>([])
const googleMode = ref(false)
const loading = ref(false)
const open = ref(false)
const searched = ref(false)
const highlighted = ref(-1)
const confirmedAddress = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, (v) => { if (v !== query.value) query.value = v })

function primaryLabel(r: NominatimResult): string {
  const a = r.address
  if (!a) return r.display_name.split(',')[0]
  return [a.road, a.suburb ?? a.neighbourhood].filter(Boolean).join(', ') || r.display_name.split(',')[0]
}

function secondaryLabel(r: NominatimResult): string {
  const a = r.address
  if (!a) return r.display_name.split(',').slice(1, 4).join(',').trim()
  return [a.city ?? a.county, a.state, a.country].filter(Boolean).join(', ')
}

function onInput() {
  open.value = true
  searched.value = false
  highlighted.value = -1
  confirmedAddress.value = ''
  emit('update:modelValue', query.value)
  if (debounceTimer) clearTimeout(debounceTimer)
  if (query.value.trim().length < 3) { results.value = []; googleResults.value = []; return }
  debounceTimer = setTimeout(search, 400)
}

async function search() {
  loading.value = true
  try {
    const gData = await api.get<{ success: boolean; data: GooglePrediction[] }>(
      `/api/places/autocomplete?q=${encodeURIComponent(query.value)}`
    )
    if (gData.success && (gData as unknown as { data: GooglePrediction[] }).data?.length > 0) {
      googleMode.value = true
      googleResults.value = (gData as unknown as { data: GooglePrediction[] }).data
      results.value = []
      searched.value = true
      return
    }
  } catch { /* fall through */ }

  googleMode.value = false
  try {
    const qs = new URLSearchParams({
      q: query.value, format: 'json', addressdetails: '1', limit: '7', countrycodes: 'ke',
    })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'QeSuite/1.0' }
    })
    results.value = await res.json() as NominatimResult[]
    googleResults.value = []
  } catch {
    results.value = []
  } finally {
    loading.value = false
    searched.value = true
  }
}

function select(r: NominatimResult) {
  const address = [primaryLabel(r), secondaryLabel(r)].filter(Boolean).join(', ')
  query.value = address
  confirmedAddress.value = address
  emit('update:modelValue', address)
  emit('select', { address, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
  open.value = false
  results.value = []
}

async function selectGoogle(r: GooglePrediction) {
  query.value = r.description
  emit('update:modelValue', r.description)
  open.value = false
  googleResults.value = []
  try {
    const data = await api.get<{ success: boolean; data: { address: string; lat: number; lng: number } }>(
      `/api/places/details?place_id=${encodeURIComponent(r.place_id)}`
    )
    if ((data as unknown as { success: boolean }).success) {
      const d = (data as unknown as { data: { address: string; lat: number; lng: number } }).data
      confirmedAddress.value = d.address || r.description
      emit('select', { address: d.address || r.description, lat: d.lat, lng: d.lng })
      return
    }
  } catch { /* coords not critical */ }
  confirmedAddress.value = r.description
  emit('select', { address: r.description, lat: 0, lng: 0 })
}

function selectHighlighted() {
  if (highlighted.value >= 0 && results.value[highlighted.value]) select(results.value[highlighted.value])
}

function moveDown() { highlighted.value = Math.min(highlighted.value + 1, results.value.length - 1) }
function moveUp()   { highlighted.value = Math.max(highlighted.value - 1, -1) }
function close()    { open.value = false; highlighted.value = -1 }

function useAsTyped() {
  const addr = query.value.trim()
  if (!addr) return
  confirmedAddress.value = addr
  emit('update:modelValue', addr)
  emit('select', { address: addr, lat: 0, lng: 0 })
  open.value = false
}

function clear() {
  query.value = ''
  confirmedAddress.value = ''
  results.value = []
  googleResults.value = []
  open.value = false
  emit('update:modelValue', '')
  emit('select', { address: '', lat: 0, lng: 0 })
  inputRef.value?.focus()
}

function onBlur() { setTimeout(close, 150) }
</script>
