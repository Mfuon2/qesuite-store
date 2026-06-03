<template>
  <Transition name="location-slide">
    <div
      v-if="visible"
      class="fixed bottom-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-3 sm:bottom-6"
    >
      <!-- Granted -->
      <div
        v-if="status === 'granted'"
        class="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <MapPinIcon class="h-4 w-4 text-emerald-700" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-emerald-900">Location detected</p>
          <p v-if="store.userAddress" class="truncate text-xs text-emerald-700">{{ store.userAddress }}</p>
        </div>
        <button class="shrink-0 text-slate-400 hover:text-slate-600" @click="dismiss">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <!-- Idle / first-time prompt -->
      <div
        v-else-if="status === 'idle'"
        class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-xl"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
          <MapPinIcon class="h-4 w-4 text-slate-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-slate-900">Share your location</p>
          <p class="mt-0.5 text-xs leading-5 text-slate-500">
            We'll use it to show accurate delivery fees and fill your address at checkout.
          </p>
          <div class="mt-2.5 flex gap-2">
            <button
              class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
              :style="{ backgroundColor: 'var(--color-primary)' }"
              @click="allow"
            >
              <MapPinIcon class="h-3.5 w-3.5" />
              Allow location
            </button>
            <button
              class="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
              @click="dismiss"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <!-- Requesting -->
      <div
        v-else-if="status === 'requesting'"
        class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
          <svg class="h-4 w-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-slate-700">Detecting your location…</p>
      </div>

      <!-- Denied -->
      <div
        v-else-if="status === 'denied'"
        class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-xl"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <ExclamationTriangleIcon class="h-4 w-4 text-amber-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-amber-900">Location access blocked</p>
          <p class="mt-0.5 text-xs leading-5 text-amber-700">
            To enable: tap the 🔒 lock icon in your browser's address bar → Site settings → Allow Location.
          </p>
          <button
            class="mt-2 text-xs font-bold text-amber-700 underline underline-offset-2"
            @click="dismiss"
          >
            I'll enter my address manually
          </button>
        </div>
        <button class="shrink-0 text-amber-400 hover:text-amber-600" @click="dismiss">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { MapPinIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useStorefrontStore } from '@/stores/store'

const store = useStorefrontStore()
const dismissed = ref(false)

const status = computed(() => store.locationStatus)

const visible = computed(() => {
  if (dismissed.value) return false
  // Hide once granted and address has loaded (auto-dismiss after short delay handled by watch)
  return ['idle', 'requesting', 'granted', 'denied'].includes(status.value)
})

// Auto-dismiss the success banner after 3 seconds
watch(status, (s) => {
  if (s === 'granted') {
    setTimeout(() => { dismissed.value = true }, 3000)
  }
})

function allow() {
  store.requestLocation()
}

function dismiss() {
  dismissed.value = true
}

// Show the prompt 1.5s after mount (gives the page time to render, feels less intrusive)
onMounted(() => {
  if (status.value === 'idle') {
    setTimeout(() => {
      // Only auto-request if the user hasn't interacted yet
      if (store.locationStatus === 'idle') {
        store.requestLocation()
      }
    }, 1500)
  }
})
</script>

<style scoped>
.location-slide-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.location-slide-leave-active { transition: all 0.2s ease-in; }
.location-slide-enter-from { opacity: 0; transform: translateX(-50%) translateY(20px); }
.location-slide-leave-to   { opacity: 0; transform: translateX(-50%) translateY(16px); }
</style>
