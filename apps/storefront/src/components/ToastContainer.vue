<template>
  <Teleport to="body">
    <div
      class="fixed z-[9999] flex flex-col gap-2 pointer-events-none
             top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4
             md:left-auto md:right-4 md:translate-x-0"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-bounce-in"
          :class="toastClasses(toast.type)"
        >
          <component :is="toastIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            @click="dismiss(toast.id)"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid'
import type { ToastType } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

function toastClasses(type: ToastType) {
  return {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-gray-800 text-white',
  }[type]
}

function toastIcon(type: ToastType) {
  return {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }[type]
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.95); }
</style>
