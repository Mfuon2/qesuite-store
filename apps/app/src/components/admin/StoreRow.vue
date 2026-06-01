<template>
  <tr class="table-tr">
    <!-- Store name + logo -->
    <td class="table-td">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <img
            v-if="store.logo_url"
            :src="store.logo_url"
            :alt="store.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-sm font-black text-emerald-700">
            {{ store.name[0] }}
          </div>
        </div>
        <div class="min-w-0">
          <p class="truncate font-bold leading-none text-slate-950">{{ store.name }}</p>
          <p class="mt-1 truncate text-xs font-medium text-slate-500">{{ store.slug }}</p>
        </div>
      </div>
    </td>

    <!-- Owner phone -->
    <td class="table-td text-slate-700">{{ store.owner_phone ?? '—' }}</td>

    <!-- Plan -->
    <td class="table-td">
      <span class="admin-pill bg-emerald-50 text-emerald-700 capitalize">
        {{ store.plan }}
      </span>
    </td>

    <!-- Status -->
    <td class="table-td">
      <StatusBadge :status="store.subscription_status" :suspended="store.is_suspended" />
    </td>

    <!-- Trial expiry -->
    <td class="table-td text-slate-700">
      <span v-if="store.trial_ends_at" :class="isExpiringSoon(store.trial_ends_at) ? 'text-amber-700 font-medium' : ''">
        {{ formatDate(store.trial_ends_at) }}
      </span>
      <span v-else class="text-slate-600">—</span>
    </td>

    <!-- Total orders -->
    <td class="table-td text-right text-slate-800">
      {{ store.total_orders.toLocaleString() }}
    </td>

    <!-- GMV -->
    <td class="table-td text-right text-slate-800 font-medium">
      KES {{ formatMoney(store.total_gmv) }}
    </td>

    <!-- Actions -->
    <td class="table-td text-right">
      <div class="flex items-center justify-end gap-1">
        <button
          class="admin-action-icon"
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
          class="admin-action-icon hover:text-amber-600"
          title="Extend trial"
          @click="$emit('extend', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        <button
          v-if="store.is_suspended"
          class="admin-action-icon"
          title="Unsuspend"
          @click="$emit('unsuspend', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          v-else
          class="admin-action-icon hover:text-red-600"
          title="Suspend"
          @click="$emit('suspend', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>

        <!-- Delete — only available on suspended stores -->
        <button
          v-if="store.is_suspended"
          class="admin-action-icon hover:text-red-700"
          title="Delete store permanently"
          @click="$emit('delete', store)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { AdminStore } from '@/stores/stores'
import { formatDate } from '@/composables/useDateFormat'
import StatusBadge from './StatusBadge.vue'

defineProps<{ store: AdminStore }>()
defineEmits<{
  view: [id: string]
  suspend: [store: AdminStore]
  unsuspend: [store: AdminStore]
  extend: [store: AdminStore]
  delete: [store: AdminStore]
}>()

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
