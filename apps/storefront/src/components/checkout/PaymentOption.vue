<template>
  <button
    class="flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all"
    :class="selected
      ? 'border-emerald-500 bg-emerald-50'
      : 'border-slate-100 bg-white hover:border-emerald-100 hover:bg-emerald-50/40'"
    @click="$emit('select', value)"
  >
    <span
      class="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl"
      :class="selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
    >
      <component :is="icon" class="h-5 w-5" />
    </span>
    <div class="min-w-0 flex-1">
      <p
        class="text-sm font-extrabold"
        :class="selected ? 'text-emerald-700' : 'text-slate-950'"
      >
        {{ title }}
      </p>
      <p class="mt-0.5 text-xs text-slate-500">{{ description }}</p>
    </div>
    <div
      class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
      :class="selected ? 'border-emerald-500' : 'border-slate-300'"
    >
      <div
        v-if="selected"
        class="w-2.5 h-2.5 rounded-full animate-bounce-in"
        :style="{ backgroundColor: 'var(--color-primary)' }"
      />
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  value: string
  selected: boolean
  title: string
  description: string
  icon: Component
}>()
defineEmits<{ select: [value: string] }>()
</script>
