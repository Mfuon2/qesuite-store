<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" @click="$emit('cancel')" />

    <div class="relative w-full max-w-md animate-fade-in">
      <div
        :class="[
          'admin-card overflow-hidden',
          danger ? 'border-red-200' : '',
        ]"
      >
        <!-- Danger header band -->
        <div v-if="danger" class="border-b border-red-100 bg-red-50 px-4 pb-3 pt-4">
          <div class="flex items-start gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-base font-bold text-red-900">{{ title }}</h2>
              <p class="mt-0.5 text-xs font-semibold uppercase tracking-wide text-red-500">
                Irreversible operation
              </p>
            </div>
          </div>
        </div>

        <!-- Standard header (non-danger) -->
        <div v-else class="px-4 pt-4">
          <h2 class="text-base font-bold text-slate-950">{{ title }}</h2>
        </div>

        <!-- Body -->
        <div class="px-4 py-3">
          <p class="text-xs leading-5 text-slate-600">{{ message }}</p>

          <!-- Danger extra warning — only shown for destructive ops that require typed confirmation -->
          <div v-if="requireText" class="mt-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2">
            <p class="text-xs font-semibold text-red-700">
              This will permanently erase all data associated with this store including orders, products, customers and delivery staff. There is no way to recover this data once deleted.
            </p>
          </div>

          <!-- Type-to-confirm input -->
          <div v-if="requireText" class="mt-3">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              Type <span class="font-mono font-bold text-red-600">{{ requireText }}</span> to confirm
            </label>
            <input
              v-model="confirmInput"
              type="text"
              :placeholder="requireText"
              class="admin-input font-mono focus:border-red-400"
              autocomplete="off"
              @paste.prevent
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 border-t border-slate-100 px-4 py-3">
          <button
            class="admin-btn-secondary flex-1 justify-center"
            @click="$emit('cancel')"
          >
            {{ cancelLabel ?? 'Cancel' }}
          </button>
          <button
            class="flex-1 justify-center"
            :class="[
              danger ? 'admin-btn-danger' : 'admin-btn-primary',
              confirmBlocked ? 'opacity-40 cursor-not-allowed' : '',
            ]"
            :disabled="confirmBlocked"
            @click="handleConfirm"
          >
            {{ confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  requireText?: string   // e.g. "DELETE" — user must type this to unlock confirm
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirmInput = ref('')

const confirmBlocked = computed(() =>
  !!props.requireText && confirmInput.value !== props.requireText
)

function handleConfirm() {
  if (confirmBlocked.value) return
  emit('confirm')
}
</script>
