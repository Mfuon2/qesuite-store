<template>
  <div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100" :style="{ height }">
    <!-- Loading state -->
    <div v-if="!mapReady" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
        <svg class="h-5 w-5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
      <p class="text-xs font-medium text-slate-500">Loading map…</p>
    </div>

    <!-- Map container -->
    <div ref="mapEl" class="h-full w-full" />

    <!-- Recenter button -->
    <button
      v-if="mapReady && riderLat"
      class="absolute bottom-3 right-3 z-[1000] flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-lg transition active:scale-95"
      @click="recenter"
    >
      <svg class="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z"/>
      </svg>
    </button>
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
  latLngBounds(a: [number, number], b: [number, number]): [[number, number], [number, number]]
  polyline(latlngs: [number, number][], opts?: object): LeafletPolyline
}

const props = withDefaults(defineProps<{
  riderLat?: number | null
  riderLng?: number | null
  destLat?: number | null
  destLng?: number | null
  height?: string
}>(), {
  height: '220px',
})

const mapEl = ref<HTMLElement | null>(null)
const mapReady = ref(false)
let map: LeafletMap | null = null
let riderMarker: LeafletMarker | null = null
let destMarker: LeafletMarker | null = null
let routeLine: LeafletPolyline | null = null

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

function riderIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:var(--color-primary,#148447);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 17a2 2 0 1 0 0 .01M19 17a2 2 0 1 0 0 .01M7 17h6l3-7h2l1 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 10H7l-2 4M13 17h2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function destIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:#ef4444;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 10.5h.01" stroke="white" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

async function loadLeaflet(): Promise<void> {
  if ((window as unknown as Record<string, unknown>).L) return
  // CSS
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: LEAFLET_CSS })
    document.head.appendChild(link)
  }
  // JS
  await new Promise<void>((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).L) { resolve(); return }
    const s = Object.assign(document.createElement('script'), { src: LEAFLET_JS })
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function initMap() {
  if (!mapEl.value || map) return
  map = L.map(mapEl.value)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  const lat = props.riderLat ?? props.destLat ?? -1.286389
  const lng = props.riderLng ?? props.destLng ?? 36.817223
  map.setView([lat, lng], 15)
  mapReady.value = true
  updatePins()
}

function updatePins() {
  if (!map) return

  // Rider pin
  if (props.riderLat && props.riderLng) {
    const latlng: [number, number] = [props.riderLat, props.riderLng]
    if (riderMarker) riderMarker.setLatLng(latlng)
    else riderMarker = L.marker(latlng, { icon: riderIcon() }).addTo(map)
  }

  // Destination pin
  if (props.destLat && props.destLng) {
    const latlng: [number, number] = [props.destLat, props.destLng]
    if (destMarker) destMarker.setLatLng(latlng)
    else destMarker = L.marker(latlng, { icon: destIcon() }).addTo(map)
  }

  // Line between rider and destination
  if (props.riderLat && props.riderLng && props.destLat && props.destLng) {
    const points: [number, number][] = [
      [props.riderLat, props.riderLng],
      [props.destLat, props.destLng],
    ]
    if (routeLine) routeLine.setLatLngs(points)
    else routeLine = L.polyline(points, { color: 'var(--color-primary,#148447)', weight: 3, dashArray: '6,8', opacity: 0.7 }).addTo(map)
    recenter()
  } else if (props.riderLat && props.riderLng) {
    map.setView([props.riderLat, props.riderLng], 15)
  }
}

function recenter() {
  if (!map) return
  if (props.riderLat && props.riderLng && props.destLat && props.destLng) {
    map.fitBounds(
      [[props.riderLat, props.riderLng], [props.destLat, props.destLng]],
      { padding: [40, 40] }
    )
  } else if (props.riderLat && props.riderLng) {
    map.setView([props.riderLat, props.riderLng], 15)
  }
}

onMounted(async () => {
  await loadLeaflet()
  initMap()
})

onUnmounted(() => {
  routeLine?.remove()
  riderMarker?.remove()
  destMarker?.remove()
  map?.remove()
  map = null
})

watch([() => props.riderLat, () => props.riderLng, () => props.destLat, () => props.destLng], updatePins)
</script>
