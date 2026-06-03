<template>
  <div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100" :style="{ height }">
    <div v-if="!mapReady" class="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <svg class="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <p class="text-xs font-medium text-slate-400">Loading map…</p>
    </div>
    <div ref="mapEl" class="h-full w-full" />
    <button
      v-if="mapReady && (riderLat || destLat)"
      class="absolute bottom-3 right-3 z-[1000] flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-lg text-slate-600 transition hover:bg-slate-50 active:scale-95"
      @click="recenter"
      title="Recenter map"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z"/>
      </svg>
    </button>
    <!-- Live indicator -->
    <div v-if="mapReady && riderLat" class="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow">
      <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      Rider live
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface LeafletMap {
  setView(center: [number, number], zoom: number): void
  fitBounds(bounds: [[number, number], [number, number]], opts?: object): void
  remove(): void
}

interface LeafletMarker {
  setLatLng(latlng: [number, number]): void
  addTo(map: LeafletMap): LeafletMarker
  remove(): void
}

interface LeafletPolyline {
  addTo(map: LeafletMap): LeafletPolyline
  setLatLngs(latlngs: [number, number][]): void
  remove(): void
}

declare const L: {
  map(el: HTMLElement): LeafletMap
  tileLayer(url: string, opts: object): { addTo(m: LeafletMap): void }
  divIcon(opts: object): object
  marker(latlng: [number, number], opts?: object): LeafletMarker
  polyline(latlngs: [number, number][], opts?: object): LeafletPolyline
}

const props = withDefaults(defineProps<{
  riderLat?: number | null
  riderLng?: number | null
  destLat?: number | null
  destLng?: number | null
  height?: string
}>(), { height: '260px' })

const mapEl = ref<HTMLElement | null>(null)
const mapReady = ref(false)
let mapInstance: ReturnType<typeof L.map> | null = null
let riderMarker: ReturnType<typeof L.marker> | null = null
let destMarker: ReturnType<typeof L.marker> | null = null
let routeLine: ReturnType<typeof L.polyline> | null = null

const CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const JS_URL  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

async function loadLeaflet() {
  if ((window as unknown as Record<string, unknown>).L) return
  if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: CSS_URL }))
  }
  await new Promise<void>((res, rej) => {
    const s = Object.assign(document.createElement('script'), { src: JS_URL })
    s.onload = () => res(); s.onerror = rej
    document.head.appendChild(s)
  })
}

function icon(kind: 'rider' | 'destination', color: string, size = 36) {
  const iconSvg = kind === 'rider'
    ? `<svg width="${Math.round(size * 0.54)}" height="${Math.round(size * 0.54)}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17a2 2 0 1 0 0 .01M19 17a2 2 0 1 0 0 .01M7 17h6l3-7h2l1 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 10H7l-2 4M13 17h2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg width="${Math.round(size * 0.5)}" height="${Math.round(size * 0.5)}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 10.5h.01" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;">${iconSvg}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  })
}

function updatePins() {
  if (!mapInstance) return

  if (props.riderLat && props.riderLng) {
    const ll: [number, number] = [props.riderLat, props.riderLng]
    if (riderMarker) riderMarker.setLatLng(ll)
    else riderMarker = L.marker(ll, { icon: icon('rider', '#148447') }).addTo(mapInstance)
  }
  if (props.destLat && props.destLng) {
    const ll: [number, number] = [props.destLat, props.destLng]
    if (destMarker) destMarker.setLatLng(ll)
    else destMarker = L.marker(ll, { icon: icon('destination', '#ef4444', 32) }).addTo(mapInstance)
  }
  if (props.riderLat && props.riderLng && props.destLat && props.destLng) {
    const pts: [number, number][] = [[props.riderLat, props.riderLng], [props.destLat, props.destLng]]
    if (routeLine) routeLine.setLatLngs(pts)
    else routeLine = L.polyline(pts, { color: '#148447', weight: 3, dashArray: '6 8', opacity: 0.65 }).addTo(mapInstance)
    mapInstance.fitBounds([[props.riderLat, props.riderLng], [props.destLat, props.destLng]], { padding: [40, 40] })
  } else if (props.riderLat && props.riderLng) {
    mapInstance.setView([props.riderLat, props.riderLng], 15)
  }
}

function recenter() {
  if (!mapInstance) return
  if (props.riderLat && props.riderLng && props.destLat && props.destLng) {
    mapInstance.fitBounds([[props.riderLat, props.riderLng], [props.destLat, props.destLng]], { padding: [40, 40] })
  } else if (props.riderLat && props.riderLng) {
    mapInstance.setView([props.riderLat, props.riderLng], 15)
  }
}

onMounted(async () => {
  await loadLeaflet()
  if (!mapEl.value) return
  mapInstance = L.map(mapEl.value)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance)
  const lat = props.riderLat ?? props.destLat ?? -1.2864
  const lng = props.riderLng ?? props.destLng ?? 36.8172
  mapInstance.setView([lat, lng], 14)
  mapReady.value = true
  updatePins()
})

onUnmounted(() => {
  routeLine?.remove(); riderMarker?.remove(); destMarker?.remove()
  mapInstance?.remove()
  mapInstance = null
})

watch([() => props.riderLat, () => props.riderLng, () => props.destLat, () => props.destLng], updatePins)
</script>
