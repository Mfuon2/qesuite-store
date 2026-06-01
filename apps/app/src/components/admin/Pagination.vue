<template>
  <div class="flex w-full flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
    <!-- Info -->
    <p class="font-medium text-slate-500">
      Showing {{ startItem }}–{{ endItem }} of {{ totalItems.toLocaleString() }} results
    </p>

    <!-- Controls -->
    <div class="owner-segmented">
      <!-- Prev -->
      <button
        class="owner-segment-button disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="current <= 1"
        title="Previous page"
        @click="$emit('change', current - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Page numbers -->
      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '...'" class="grid h-9 min-w-9 place-items-center px-2 text-slate-400">…</span>
        <button
          v-else
          :class="['owner-segment-button', p === current ? 'owner-segment-button-active' : '']"
          @click="$emit('change', p as number)"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next -->
      <button
        class="owner-segment-button disabled:cursor-not-allowed disabled:opacity-30"
        :disabled="current >= totalPages"
        title="Next page"
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

const startItem = computed(() => props.totalItems === 0 ? 0 : (props.current - 1) * props.pageSize + 1)
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
