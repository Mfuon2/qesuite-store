<template>
  <div class="flex items-center justify-between text-sm">
    <!-- Info -->
    <p class="text-slate-400">
      Showing {{ startItem }}–{{ endItem }} of {{ totalItems.toLocaleString() }} results
    </p>

    <!-- Controls -->
    <div class="flex items-center gap-1">
      <!-- Prev -->
      <button
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        :disabled="current <= 1"
        @click="$emit('change', current - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Page numbers -->
      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '...'" class="px-2 text-slate-500">…</span>
        <button
          v-else
          class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
          :class="p === current
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'"
          @click="$emit('change', p as number)"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next -->
      <button
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        :disabled="current >= totalPages"
        @click="$emit('change', current + 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  totalPages: number
  totalItems: number
  pageSize: number
}>()

defineEmits<{
  change: [page: number]
}>()

const startItem = computed(() => (props.current - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.current * props.pageSize, props.totalItems))

const pageNumbers = computed(() => {
  const pages: (number | '...')[] = []
  const total = props.totalPages
  const cur = props.current

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    pages.push(i)
  }
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})
</script>
