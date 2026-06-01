<template>
  <Teleport to="body">
    <Transition name="network-loader">
      <div v-if="isActive" class="pointer-events-none fixed inset-x-0 top-0 z-[10000]">
        <div class="h-1 overflow-hidden bg-emerald-50">
          <div class="network-loader__bar h-full w-1/2 rounded-r-full"></div>
        </div>

        <div class="mx-auto mt-3 flex max-w-[1500px] justify-center px-4 sm:justify-end sm:px-6 lg:px-8">
          <div class="pointer-events-auto flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/95 px-3 py-2 shadow-[0_14px_36px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div class="relative grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
              <span class="absolute inset-0 rounded-xl border border-emerald-200"></span>
              <span class="network-loader__ring absolute inset-1 rounded-full border-2 border-emerald-100 border-t-[var(--color-primary)]"></span>
              <span class="qs-brand-mark !h-6 !w-6 !rounded-md !shadow-none"></span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-extrabold leading-tight text-slate-950">{{ label }}</p>
              <p class="text-xs font-semibold text-slate-500">Updating your workspace</p>
            </div>
            <div class="network-loader__dots flex items-center gap-1 pl-1">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useNetworkActivity } from '@/composables/useNetworkActivity'

const { isActive, label } = useNetworkActivity()
</script>

<style scoped>
.network-loader-enter-active,
.network-loader-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.network-loader-enter-from,
.network-loader-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.network-loader__bar {
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-primary) 70%, #fff), var(--color-primary), transparent);
  animation: network-slide 1.15s ease-in-out infinite;
}

.network-loader__ring {
  animation: network-spin 0.85s linear infinite;
}

.network-loader__dots span {
  width: 0.28rem;
  height: 0.28rem;
  border-radius: 999px;
  background: var(--color-primary);
  animation: network-pulse 0.9s ease-in-out infinite;
}

.network-loader__dots span:nth-child(2) { animation-delay: 0.12s; }
.network-loader__dots span:nth-child(3) { animation-delay: 0.24s; }

@keyframes network-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(220%); }
}

@keyframes network-spin {
  to { transform: rotate(360deg); }
}

@keyframes network-pulse {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-2px); }
}
</style>
