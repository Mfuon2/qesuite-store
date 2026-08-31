<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Sync diagnostics</h1>
          <p class="owner-subtitle">This device's offline-first POS status — what's synced, what's pending, and what needs attention.</p>
        </div>
        <button type="button" class="owner-primary-action" :disabled="isSyncing" @click="runSyncCycle()">
          <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': isSyncing }" />
          {{ isSyncing ? 'Syncing…' : 'Sync now' }}
        </button>
      </div>
    </section>

    <section class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="owner-panel p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Connectivity</p>
        <p class="mt-1 flex items-center gap-1.5 text-lg font-black" :class="isReachable ? 'text-emerald-600' : 'text-red-600'">
          <span class="h-2 w-2 rounded-full" :class="isReachable ? 'bg-emerald-500' : 'bg-red-500'" />
          {{ isReachable ? 'Online' : 'Offline' }}
        </p>
      </div>
      <div class="owner-panel p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending changes</p>
        <p class="mt-1 text-lg font-black text-slate-950">{{ counts.pending }}</p>
      </div>
      <div class="owner-panel p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Needs attention</p>
        <p class="mt-1 text-lg font-black" :class="counts.failed + counts.conflict > 0 ? 'text-amber-600' : 'text-slate-950'">
          {{ counts.failed + counts.conflict }}
        </p>
      </div>
      <div class="owner-panel p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Last synced</p>
        <p class="mt-1 text-sm font-bold text-slate-800">{{ lastSyncSuccessAt ? formatDate(lastSyncSuccessAt) : 'Never' }}</p>
      </div>
    </section>

    <section v-if="lastSyncError" class="owner-panel mt-3 border border-red-200 bg-red-50 p-4">
      <p class="text-xs font-extrabold uppercase tracking-wide text-red-700">Last sync problem</p>
      <p class="mt-1 text-sm text-red-800">{{ lastSyncError }}</p>
    </section>

    <section class="owner-panel mt-3 p-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">This device</p>
      <dl class="mt-2 space-y-1.5 text-sm">
        <div class="flex justify-between gap-3"><dt class="text-slate-500">Device id</dt><dd class="truncate font-mono text-xs text-slate-700">{{ deviceId ?? '—' }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-slate-500">Last sync attempt</dt><dd class="text-slate-700">{{ lastSyncAttemptAt ? formatDate(lastSyncAttemptAt) : '—' }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-slate-500">Synced</dt><dd class="text-slate-700">{{ counts.synced }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-slate-500">Rejected</dt><dd class="text-slate-700">{{ counts.rejected }}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-slate-500">Pending manager approval</dt><dd class="text-slate-700">{{ counts.pendingApproval }}</dd></div>
      </dl>
    </section>

    <p class="mt-3 text-xs text-slate-400">Diagnostics only — payloads and credentials are never shown here or in logs.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { formatDate } from '@/composables/useDateFormat'
import { isReachable } from '@/offline/connectivity'
import { runSyncCycle, isSyncing, lastSyncAttemptAt, lastSyncSuccessAt, lastSyncError } from '@/offline/syncEngine'
import { onOutboxChanged } from '@/offline/outbox'
import { offlineDb } from '@/offline/db'

const deviceId = ref<string | null>(null)
const counts = ref({ pending: 0, failed: 0, conflict: 0, synced: 0, rejected: 0, pendingApproval: 0 })

async function refreshCounts() {
  const all = await offlineDb.outboxMutations.toArray()
  counts.value = {
    pending: all.filter(m => m.state === 'pending' || m.state === 'syncing').length,
    failed: all.filter(m => m.state === 'failed').length,
    conflict: all.filter(m => m.state === 'conflict').length,
    synced: all.filter(m => m.state === 'synced').length,
    rejected: all.filter(m => m.state === 'rejected').length,
    pendingApproval: all.filter(m => m.state === 'pending_approval').length,
  }
}

let unsubscribe: (() => void) | undefined
let interval: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  const meta = await offlineDb.deviceMeta.get('device')
  deviceId.value = meta?.deviceId ?? null
  await refreshCounts()
  unsubscribe = onOutboxChanged(refreshCounts)
  interval = setInterval(refreshCounts, 5000)
})

onUnmounted(() => {
  unsubscribe?.()
  clearInterval(interval)
})
</script>
