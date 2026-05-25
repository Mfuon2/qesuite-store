<template>
  <tr class="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
    <!-- Store name + logo -->
    <td class="table-td">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
          <img
            v-if="store.logo_url"
            :src="store.logo_url"
            :alt="store.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
            {{ store.name[0] }}
          </div>
        </div>
        <div>
          <p class="font-semibold text-slate-100 leading-none">{{ store.name }}</p>
          <p class="text-slate-400 text-xs mt-0.5">{{ store.slug }}</p>
        </div>
      </div>
    </td>

    <!-- Owner phone -->
    <td class="table-td text-slate-300">{{ store.owner_phone ?? '—' }}</td>

    <!-- Plan -->
    <td class="table-td">
      <span class="px-2 py-0.5 bg-slate-700 rounded text-xs font-semibold capitalize text-slate-200">
        {{ store.plan }}
      </span>
    </td>

    <!-- Status -->
    <td class="table-td">
      <StatusBadge :status="store.subscription_status" :suspended="store.is_suspended" />
    </td>

    <!-- Trial expiry -->
    <td class="table-td text-slate-300">
      <span v-if="store.trial_ends_at" :class="isExpiringSoon(store.trial_ends_at) ? 'text-amber-400 font-medium' : ''">
        {{ formatDate(store.trial_ends_at) }}
      </span>
      <span v-else class="text-slate-600">—</span>
    </td>

    <!-- Total orders -->
    <td class="table-td text-right text-slate-200">
      {{ store.total_orders.toLocaleString() }}
    </td>

    <!-- GMV -->
    <td class="table-td text-right text-slate-200 font-medium">
      KES {{ formatMoney(store.total_gmv) }}
    </td>

    <!-- Actions -->
    <td class="table-td text-right">
      <div class="flex items-center justify-end gap-1">
        <button
          class="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-600 rounded-lg transition-colors"
          title="View store"
          @click="$emit('view', store.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        <button
          v-if="store.trial_ends_at"
          class="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-600 rounded-lg transition-colors"
          title="Extend trial"
          @click="$emit('extend', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        <button
          v-if="store.is_suspended"
          class="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-600 rounded-lg transition-colors"
          title="Unsuspend"
          @click="$emit('unsuspend', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          v-else
          class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
          title="Suspend"
          @click="$emit('suspend', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { AdminStore } from '@/stores/stores'
import StatusBadge from './StatusBadge.vue'

defineProps<{ store: AdminStore }>()
defineEmits<{
  view: [id: string]
  suspend: [store: AdminStore]
  unsuspend: [store: AdminStore]
  extend: [store: AdminStore]
}>()

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toLocaleString()
}

function isExpiringSoon(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 // < 3 days
}
</script>
