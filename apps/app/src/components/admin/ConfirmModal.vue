<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('cancel')"></div>
    <div class="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
      <h2 class="text-lg font-bold text-white mb-2">{{ title }}</h2>
      <p class="text-slate-400 text-sm mb-6">{{ message }}</p>

      <div class="flex gap-3">
        <button class="admin-btn-secondary flex-1 justify-center" @click="$emit('cancel')">
          {{ cancelLabel ?? 'Cancel' }}
        </button>
        <button
          class="flex-1 justify-center"
          :class="danger ? 'admin-btn-danger' : 'admin-btn-primary'"
          @click="$emit('confirm')"
        >
          {{ confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()
defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
