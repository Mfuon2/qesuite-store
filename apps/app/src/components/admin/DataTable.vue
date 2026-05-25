<template>
  <div class="admin-card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="border-b border-slate-700">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="table-th"
              :class="[
                col.align === 'right' ? 'text-right' : '',
                col.sortable ? 'cursor-pointer hover:text-slate-200 select-none' : ''
              ]"
              @click="col.sortable ? $emit('sort', col.key) : undefined"
            >
              {{ col.label }}
              <span v-if="col.sortable && sortBy === col.key" class="ml-1 text-slate-400">
                {{ sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <slot name="rows" />
          <tr v-if="loading && !hasRows">
            <td :colspan="columns.length" class="py-12 text-center">
              <svg class="w-6 h-6 animate-spin text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </td>
          </tr>
          <tr v-else-if="!hasRows">
            <td :colspan="columns.length" class="py-12 text-center text-slate-500">
              <slot name="empty">No data found</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="border-t border-slate-700">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSlots, computed } from 'vue'

export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
}

const props = defineProps<{
  columns: TableColumn[]
  loading?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}>()

defineEmits<{
  sort: [key: string]
}>()

const slots = useSlots()
const hasRows = computed(() => !!slots.rows)
</script>
