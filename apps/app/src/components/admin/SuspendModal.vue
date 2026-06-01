<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" @click="$emit('cancel')"></div>
    <div class="admin-card relative w-full max-w-sm animate-fade-in p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
          <svg class="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-950">Suspend Store</h2>
          <p class="text-slate-500 text-sm">{{ storeName }}</p>
        </div>
      </div>

      <p class="text-slate-600 text-sm mb-4">
        This will immediately block all access to the store. The owner will see a suspension notice.
      </p>

      <div class="mb-5">
        <label class="admin-label">Reason (optional)</label>
        <textarea
          v-model="reason"
          placeholder="e.g. Non-payment, policy violation..."
          rows="3"
          class="admin-input resize-none"
        ></textarea>
      </div>

      <div class="flex gap-3">
        <button class="admin-btn-secondary flex-1 justify-center" @click="$emit('cancel')">
          Cancel
        </button>
        <button
          class="admin-btn-danger flex-1 justify-center"
          @click="$emit('confirm', reason)"
        >
          Suspend
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ storeName: string }>()
defineEmits<{
  confirm: [reason: string]
  cancel: []
}>()

const reason = ref('')
</script>
