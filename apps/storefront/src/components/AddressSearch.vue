<template>
  <div class="relative">
    <!-- Input -->
    <div class="relative">
      <MapPinIcon class="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
        class="w-full py-3.5 pl-10 pr-10 rounded-xl border text-sm outline-none transition-colors bg-white text-slate-950 placeholder-slate-400"
        :class="error
          ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200'
          : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'"
        @input="onInput"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="close"
        @blur="onBlur"
      />
      <!-- Spinner / clear -->
      <div class="absolute right-3.5 top-1/2 -translate-y-1/2">
        <svg v-if="loading" class="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <button
          v-else-if="query"
          type="button"
          class="text-slate-400 hover:text-slate-600"
          @mousedown.prevent="clear"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Dropdown results -->
    <!-- Google Places results -->
    <Transition name="dropdown">
      <ul
        v-if="open && googleMode && googleResults.length"
        class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1.5 shadow-2xl"
      >
        <li
          v-for="(r, i) in googleResults"
          :key="r.place_id"
          :class="['flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors', highlighted === i ? 'bg-emerald-50' : 'hover:bg-slate-50']"
          @mousedown.prevent="selectGoogle(r)"
        >
          <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 leading-tight">{{ r.structured_formatting.main_text }}</p>
            <p class="truncate text-xs text-slate-400 mt-0.5">{{ r.structured_formatting.secondary_text }}</p>
          </div>
        </li>
        <li class="px-4 py-1.5 text-[10px] text-slate-300 text-right">Powered by Google</li>
      </ul>
    </Transition>

    <!-- Nominatim results -->
    <Transition name="dropdown">
      <ul
        v-if="open && !googleMode && results.length"
        class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1.5 shadow-2xl"
      >
        <li
          v-for="(result, i) in results"
          :key="result.place_id"
          :class="['flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors', highlighted === i ? 'bg-emerald-50' : 'hover:bg-slate-50']"
          @mousedown.prevent="select(result)"
        >
          <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 leading-tight">{{ primaryLabel(result) }}</p>
            <p class="truncate text-xs text-slate-400 mt-0.5">{{ secondaryLabel(result) }}</p>
          </div>
        </li>
      </ul>
    </Transition>

    <!-- No results — let user proceed with typed text anyway -->
    <Transition name="dropdown">
      <div
        v-if="open && searched && !googleResults.length && !results.length && !loading"
        class="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-2xl"
      >
        <p class="text-sm text-slate-500 text-center">No results for "<span class="font-semibold">{{ query }}</span>"</p>
        <p class="mt-1 text-xs text-slate-400 text-center">Not in our map database — you can still use it</p>
        <button
          class="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          @mousedown.prevent="useAsTyped"
        >
          Use "{{ query }}" as my address
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MapPinIcon, XMarkIcon } from '@heroicons/vue/24/outline'
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
    road?: string
    suburb?: string
    neighbourhood?: string
    city?: string
    county?: string
    state?: string
    country?: string
  }
}

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  error?: boolean
  countryCode?: string   // ISO-2 e.g. "ke" for Kenya
}>(), {
  placeholder: 'Search your delivery address…',
  countryCode: 'ke',
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
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Keep query in sync when parent changes v-model externally
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
  emit('update:modelValue', query.value)

  if (debounceTimer) clearTimeout(debounceTimer)
  if (query.value.trim().length < 3) { results.value = []; return }

  debounceTimer = setTimeout(search, 400)
}

async function search() {
  loading.value = true
  try {
    // Try Google Places proxy first (better Kenya coverage)
    const gData = await api.get<{ success: boolean; data: GooglePrediction[] }>(
      `/places/autocomplete?q=${encodeURIComponent(query.value)}`
    )
    if (gData.success && gData.data.length > 0) {
      googleMode.value = true
      googleResults.value = gData.data
      results.value = []
      loading.value = false
      searched.value = true
      return
    }
  } catch { /* fall through to Nominatim */ }

  // Fallback: Nominatim with Kenya viewbox
  googleMode.value = false
  try {
    const qs = new URLSearchParams({
      q: query.value,
      format: 'json',
      addressdetails: '1',
      namedetails: '1',
      limit: '8',
      countrycodes: 'ke',   // strict Kenya — no US/UK results
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

function select(result: NominatimResult) {
  const address = [primaryLabel(result), secondaryLabel(result)].filter(Boolean).join(', ')
  query.value = address
  emit('update:modelValue', address)
  emit('select', {
    address,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  })
  open.value = false
  results.value = []
}

function selectHighlighted() {
  if (highlighted.value >= 0 && results.value[highlighted.value]) {
    select(results.value[highlighted.value])
  }
}

function moveDown() {
  highlighted.value = Math.min(highlighted.value + 1, results.value.length - 1)
}

function moveUp() {
  highlighted.value = Math.max(highlighted.value - 1, -1)
}

function close() {
  open.value = false
  highlighted.value = -1
}

async function selectGoogle(r: GooglePrediction) {
  query.value = r.description
  emit('update:modelValue', r.description)
  open.value = false
  googleResults.value = []
  // Fetch coordinates via the Worker proxy (uses same API_BASE as all other calls)
  try {
    const data = await api.get<{ success: boolean; data: { address: string; lat: number; lng: number } }>(
      `/places/details?place_id=${encodeURIComponent(r.place_id)}`
    )
    if (data.success) {
      emit('select', { address: data.data.address || r.description, lat: data.data.lat, lng: data.data.lng })
      return
    }
  } catch { /* coords not critical */ }
  emit('select', { address: r.description, lat: 0, lng: 0 })
}

// User typed something Nominatim doesn't know — accept it as a freeform address
function useAsTyped() {
  const addr = query.value.trim()
  if (!addr) return
  emit('update:modelValue', addr)
  emit('select', { address: addr, lat: 0, lng: 0 })
  open.value = false
}

function clear() {
  query.value = ''
  results.value = []
  googleResults.value = []
  googleMode.value = false
  open.value = false
  emit('update:modelValue', '')
  emit('select', { address: '', lat: 0, lng: 0 })
  inputRef.value?.focus()
}

function onBlur() {
  // Small delay so mousedown on a result fires first
  setTimeout(close, 150)
}
</script>

<style scoped>
.dropdown-enter-active { transition: all 0.15s ease-out; }
.dropdown-leave-active { transition: all 0.1s ease-in; }
.dropdown-enter-from  { opacity: 0; transform: translateY(-6px); }
.dropdown-leave-to    { opacity: 0; transform: translateY(-4px); }
</style>
