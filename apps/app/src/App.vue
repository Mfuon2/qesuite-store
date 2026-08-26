<template>
  <div class="app-density-sm min-h-screen bg-white text-gray-900">
    <router-view />
    <GlobalNetworkLoader />

    <!-- Toast container -->
    <div class="fixed right-3 top-3 z-[9999] flex w-full max-w-xs flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-medium shadow-lg"
          :class="{
            'bg-emerald-50 border-emerald-200 text-emerald-800': toast.type === 'success',
            'bg-red-50 border-red-200 text-red-800': toast.type === 'error',
            'bg-yellow-50 border-yellow-200 text-yellow-800': toast.type === 'warning',
            'bg-blue-50 border-blue-200 text-blue-800': toast.type === 'info',
          }"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button class="shrink-0 opacity-60 hover:opacity-100" @click="removeToast(toast.id)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Confirm dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="confirm.visible"
          class="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div class="admin-card w-full max-w-sm p-4 animate-bounce-in">
            <h3 class="mb-1 text-base font-semibold text-gray-900">{{ confirm.title }}</h3>
            <p class="mb-4 text-xs leading-5 text-gray-500">{{ confirm.message }}</p>
            <div class="flex justify-end gap-2">
              <button
                class="admin-btn-secondary"
                @click="confirm.resolve(false)"
              >
                {{ confirm.cancelLabel || 'Cancel' }}
              </button>
              <button
                :class="confirm.danger ? 'admin-btn-danger' : 'admin-btn-primary'"
                @click="confirm.resolve(true)"
              >
                {{ confirm.confirmLabel || 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import GlobalNetworkLoader from '@/components/common/GlobalNetworkLoader.vue'

const { toasts, removeToast } = useToast()
const { state: confirm } = useConfirm()
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
