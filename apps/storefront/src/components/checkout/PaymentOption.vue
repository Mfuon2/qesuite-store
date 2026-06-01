<template>
  <button
    class="flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all"
    :class="selected
      ? 'border-emerald-500 bg-emerald-50'
      : 'border-slate-100 bg-white hover:border-emerald-100 hover:bg-emerald-50/40'"
    @click="$emit('select', value)"
  >
    <span class="flex-shrink-0 text-2xl">{{ icon }}</span>
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
defineProps<{
  value: string
  selected: boolean
  title: string
  description: string
  icon: string
}>()
defineEmits<{ select: [value: string] }>()
</script>
