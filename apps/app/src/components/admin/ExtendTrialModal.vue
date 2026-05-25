<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('cancel')"></div>
    <div class="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
      <h2 class="text-lg font-bold text-white mb-1">Extend Trial</h2>
      <p class="text-slate-400 text-sm mb-5">
        How many days would you like to extend the trial for
        <span class="text-slate-200 font-medium">{{ storeName }}</span>?
      </p>

      <div class="grid grid-cols-3 gap-2 mb-5">
        <button
          v-for="d in dayOptions"
          :key="d"
          class="py-3 rounded-xl text-sm font-bold transition-colors"
          :class="selected === d
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          @click="selected = d"
        >
          +{{ d }} days
        </button>
      </div>

      <div class="flex gap-3">
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
