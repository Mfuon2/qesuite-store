<template>
  <div class="owner-page">
    <!-- Compact header + filters in one bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <!-- Title + badges -->
      <div class="flex items-center gap-3 min-w-0">
        <h1 class="text-lg font-extrabold text-slate-950 shrink-0">Notifications</h1>
        <div
          v-for="b in summaryBadges"
          :key="b.label"
          :class="['flex items-center gap-1 rounded-lg border px-2 py-1 text-xs', b.cls]"
        >
          <span class="font-black">{{ b.count }}</span>
          <span class="font-semibold">{{ b.label }}</span>
        </div>
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <!-- Status filters -->
        <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            v-for="f in STATUS_FILTERS"
            :key="f.value"
            @click="setStatus(f.value)"
            :class="['rounded-lg px-3 py-1.5 text-xs font-bold transition', statusFilter === f.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50']"
          >{{ f.label }}</button>
        </div>
        <!-- Channel filters -->
        <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            v-for="ch in CHANNEL_FILTERS"
            :key="ch.value"
            @click="setChannel(ch.value)"
            :class="['rounded-lg px-3 py-1.5 text-xs font-bold transition', channelFilter === ch.value
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50']"
          >{{ ch.label }}</button>
        </div>
      </div>
    </div>

    <!-- Table card -->
    <div class="owner-panel mt-5 overflow-hidden p-0">

      <!-- Column headers -->
      <div v-if="!loading && rows.length" class="grid grid-cols-[auto_1fr_minmax(140px,28%)_auto_auto] items-center gap-x-3 border-b border-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span class="w-7" />
        <span>Message</span>
        <span>Recipient</span>
        <span class="text-right">Time</span>
        <span class="w-24 text-right">Action</span>
      </div>

      <!-- Loading skeletons -->
      <div v-if="loading" class="divide-y divide-slate-100">
        <div v-for="i in 10" :key="i" class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-2.5">
          <div class="skeleton h-6 w-6 rounded-full" />
          <div class="space-y-1.5">
            <div class="skeleton h-2.5 w-48 rounded" />
            <div class="skeleton h-2.5 w-32 rounded" />
          </div>
          <div class="skeleton h-5 w-14 rounded-full" />
          <div class="skeleton h-7 w-18 rounded-lg" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!rows.length" class="flex flex-col items-center py-12 text-center">
        <BellSlashIcon class="mb-3 h-10 w-10 text-slate-300" />
        <p class="text-sm font-bold text-slate-700">No notifications found</p>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ statusFilter || channelFilter ? 'Try clearing the filters.' : 'Messages appear here once orders are placed.' }}
        </p>
        <button v-if="statusFilter || channelFilter" @click="clearFilters" class="owner-secondary-action mt-3 text-xs">
          Clear filters
        </button>
      </div>

      <!-- Compact rows -->
      <div v-else class="divide-y divide-slate-100/80">
        <div
          v-for="n in rows"
          :key="n.id"
          class="grid grid-cols-[auto_1fr_minmax(140px,28%)_auto_auto] items-center gap-x-3 px-4 py-2.5 transition hover:bg-slate-50/70"
        >
          <!-- Channel dot -->
          <div :class="['h-6 w-6 shrink-0 flex items-center justify-center rounded-full text-white',
            n.channel === 'whatsapp' ? 'bg-blue-500' : 'bg-emerald-600']">
            <ChatBubbleLeftRightIcon v-if="n.channel === 'whatsapp'" class="h-3 w-3" />
            <DevicePhoneMobileIcon v-else class="h-3 w-3" />
          </div>

          <!-- Message + tracking code -->
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span
                v-if="n.tracking_code"
                class="shrink-0 rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-bold text-emerald-700"
              >#{{ n.tracking_code }}</span>
              <span :class="['rounded-full px-2 py-0.5 text-[10px] font-black capitalize', pillClass(n.status)]">
                {{ n.status }}
              </span>
            </div>
            <p class="mt-0.5 truncate text-xs text-slate-600">{{ displayMsg(n.message) }}</p>
          </div>

          <!-- Recipient -->
          <p class="truncate font-mono text-xs text-slate-500">{{ n.recipient }}</p>

          <!-- Time -->
          <p class="whitespace-nowrap text-right text-[11px] text-slate-400">{{ fmtDate(n.sent_at) }}</p>

          <!-- Action -->
          <div class="flex justify-end">
            <button
              v-if="n.channel === 'sms' && accessStore.can('notifications.send')"
              :disabled="sending === n.id"
              :class="['flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition active:scale-95',
                n.status === 'failed'
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : n.status === 'queued'
                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-primary']"
              @click="sendNotification(n)"
            >
              <ArrowPathIcon class="h-3 w-3" :class="sending === n.id ? 'animate-spin' : ''" />
              {{ sending === n.id ? 'Sending…' : actionLabel(n.status) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination footer -->
      <div class="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <p class="text-xs font-medium text-slate-400">{{ rangeLabel }}</p>
        <div class="flex items-center gap-0.5">
          <button
            :disabled="currentPage <= 1"
            class="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            @click="goTo(currentPage - 1)"
          ><ChevronLeftIcon class="h-3.5 w-3.5" /></button>

          <template v-for="pg in pageNumbers" :key="pg">
            <span v-if="pg === -1" class="px-1 text-slate-400 text-xs">…</span>
            <button
              v-else
              @click="goTo(pg)"
              :class="['h-7 min-w-[1.75rem] rounded-lg px-1.5 text-xs font-bold transition',
                pg === currentPage ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100']"
            >{{ pg }}</button>
          </template>

          <button
            :disabled="currentPage >= totalPages"
            class="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            @click="goTo(currentPage + 1)"
          ><ChevronRightIcon class="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-2xl"
        :class="toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'"
      >
        <CheckCircleIcon v-if="toast.type !== 'error'" class="h-4 w-4" />
        <XCircleIcon v-else class="h-4 w-4" />
        {{ toast.msg }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { formatDate as fmtDate, timeAgo } from '@/composables/useDateFormat'
import {
  BellSlashIcon, ChatBubbleLeftRightIcon, DevicePhoneMobileIcon,
  ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon,
  CheckCircleIcon, XCircleIcon,
} from '@heroicons/vue/24/outline'
import { apiFetch } from '@/api/index'
import { useAccessStore } from '@/stores/access'

// ── Types ──────────────────────────────────────────────────────
interface NotifRow {
  id: string
  order_id: string | null
  channel: string
  recipient: string
  message: string
  status: string
  sent_at: string
  tracking_code?: string | null
}
interface Meta { total: number; page: number; limit: number; total_pages: number }
interface Summary { sent?: number; failed?: number; queued?: number }

// ── Constants ──────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'queued', label: 'Queued' },
]
const CHANNEL_FILTERS = [
  { value: '', label: 'All channels' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

// ── State ──────────────────────────────────────────────────────
const loading = ref(true)
const accessStore = useAccessStore()
const rows = ref<NotifRow[]>([])
const meta = ref<Meta>({ total: 0, page: 1, limit: 25, total_pages: 1 })
const summary = ref<Summary>({})
const statusFilter = ref('')
const channelFilter = ref('')
const currentPage = ref(1)
const limit = ref(10)
const sending = ref<string | null>(null)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)

// ── Computed ───────────────────────────────────────────────────
const totalPages = computed(() => meta.value.total_pages)

const summaryBadges = computed(() => [
  { label: 'Sent', count: summary.value.sent ?? 0, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { label: 'Failed', count: summary.value.failed ?? 0, cls: 'border-red-200 bg-red-50 text-red-700' },
  { label: 'Queued', count: summary.value.queued ?? 0, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
])

const rangeLabel = computed(() => {
  const total = meta.value.total
  if (!total) return '0 results'
  const from = (currentPage.value - 1) * limit.value + 1
  const to = Math.min(currentPage.value * limit.value, total)
  return `${from}–${to} of ${total}`
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: number[] = []
  const start = Math.max(1, cur - 2)
  const end = Math.min(total, cur + 2)
  if (start > 1) { pages.push(1); if (start > 2) pages.push(-1) } // -1 = ellipsis
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total) { if (end < total - 1) pages.push(-1); pages.push(total) }
  return pages
})

// ── Helpers ────────────────────────────────────────────────────
function pillClass(s: string) {
  if (s === 'sent') return 'bg-emerald-50 text-emerald-700'
  if (s === 'failed') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-700'
}

function actionLabel(status: string) {
  if (status === 'queued') return 'Send now'
  if (status === 'failed') return 'Resend'
  return 'Send again'
}

function displayMsg(msg: string) {
  if (!msg.startsWith('{')) return msg.replace(/^\[RESEND\]\s*|\[QUEUED→SEND\]\s*/i, '')
  try {
    const m = JSON.parse(msg) as { type?: string; tracking_code?: string }
    return `Queue record — type: ${m.type ?? '?'} · order: #${m.tracking_code ?? '—'}`
  } catch { return msg }
}

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3500)
}

// ── Data ───────────────────────────────────────────────────────
async function fetch() {
  loading.value = true
  try {
    const qs = new URLSearchParams({
      page: String(currentPage.value),
      limit: String(limit.value),
    })
    if (statusFilter.value) qs.set('status', statusFilter.value)
    if (channelFilter.value) qs.set('channel', channelFilter.value)

    const res = await apiFetch<{ success: boolean; data: NotifRow[]; meta: Meta }>(
      `/api/notifications?${qs}`
    )
    if (res.success) { rows.value = res.data; meta.value = res.meta }
  } catch { /* ignore */ } finally { loading.value = false }
}

async function fetchSummary() {
  try {
    const res = await apiFetch<{ success: boolean; data: Summary }>('/api/notifications/summary')
    if (res.success) summary.value = res.data
  } catch { /* ignore */ }
}

// ── Actions ────────────────────────────────────────────────────
function setStatus(v: string) { statusFilter.value = v; currentPage.value = 1 }
function setChannel(v: string) { channelFilter.value = v; currentPage.value = 1 }
function goTo(p: number) { if (p >= 1 && p <= totalPages.value) currentPage.value = p }
function clearFilters() { statusFilter.value = ''; channelFilter.value = ''; currentPage.value = 1 }

async function sendNotification(n: NotifRow) {
  sending.value = n.id
  try {
    const res = await apiFetch<{ success: boolean; data: { status: string }; message?: string; error?: string }>(
      `/api/notifications/${n.id}/send`,
      { method: 'POST' }
    )
    if (res.success) {
      n.status = res.data.status
      showToast(res.message ?? 'SMS sent successfully')
      fetchSummary()
    } else {
      showToast(res.error ?? 'Send failed', 'error')
    }
  } catch (e: unknown) {
    showToast((e as Error).message ?? 'Send failed', 'error')
  } finally {
    sending.value = null
  }
}

// ── Watchers ───────────────────────────────────────────────────
watch([statusFilter, channelFilter, currentPage, limit], fetch)

onMounted(() => { fetch(); fetchSummary() })
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px) scale(0.96); }
</style>
