<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" @click="$emit('cancel')"></div>
    <div class="admin-card relative w-full max-w-sm animate-fade-in p-4">
      <h2 class="mb-1 text-base font-bold text-slate-950">Extend Trial</h2>
      <p class="mb-3 text-xs leading-5 text-slate-500">
        How many days would you like to extend the trial for
        <span class="text-slate-800 font-medium">{{ storeName }}</span>?
      </p>

      <div class="mb-3 grid grid-cols-3 gap-2">
        <button
          v-for="d in dayOptions"
          :key="d"
          :class="['admin-filter-pill justify-center', selected === d ? 'admin-filter-pill-active' : '']"
          @click="selected = d"
        >
          +{{ d }} days
        </button>
      </div>

      <div class="flex gap-2">
        <button class="admin-btn-secondary flex-1 justify-center" @click="$emit('cancel')">
          Cancel
        </button>
        <button
          class="admin-btn-primary flex-1 justify-center"
          :disabled="!selected"
          @click="$emit('confirm', selected)"
        >
          Extend
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ storeName: string }>()
defineEmits<{
  confirm: [days: number]
  cancel: []
}>()

const dayOptions = [7, 14, 30]
const selected = ref<number>(14)
</script>
