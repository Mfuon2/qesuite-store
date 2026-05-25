<template>
  <button
    class="w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
    :class="selected
      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'"
    @click="$emit('select', value)"
  >
    <span class="text-2xl flex-shrink-0">{{ icon }}</span>
    <div class="flex-1 min-w-0">
      <p
        class="font-semibold text-sm"
        :class="selected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'"
      >
        {{ title }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ description }}</p>
    </div>
    <div
      class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
      :class="selected ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'"
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
