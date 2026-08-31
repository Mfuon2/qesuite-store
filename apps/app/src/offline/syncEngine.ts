import { ref } from 'vue'
import { offlineDb, type OutboxState } from './db'
import { getValidDeviceCredential, ensureDeviceRegistered } from './deviceIdentity'
import { reportReachable, reportUnreachable } from './connectivity'
import { notifyOutboxChanged, onOutboxChanged } from './outbox'

// Observability surface for a diagnostics view — deliberately just status
// metadata, never mutation payloads or credentials.
export const lastSyncAttemptAt = ref<string | null>(null)
export const lastSyncSuccessAt = ref<string | null>(null)
export const lastSyncError = ref<string | null>(null)
export const isSyncing = ref(false)

// The orchestrator: PUSH (idempotent, batched) then PULL (delta, checkpointed),
// with exponential backoff + jitter on failure, single-leader concurrency via
// Web Locks (falls back to running unguarded if unsupported — duplicate
// pushes are still harmless since the server's idempotency ledger is the
// real safety net, this is just an efficiency guard against redundant work),
// and every plausible trigger point instead of only navigator.onLine events.

const PUSH_BATCH_SIZE = 20
const PULL_LIMIT = 200
const MAX_BACKOFF_MS = 60_000
const FAILED_AFTER_RETRIES = 5

let backoffMs = 2000
let retryTimer: ReturnType<typeof setTimeout> | undefined
let running = false

// Every push/pull request in one sync cycle shares a correlation id, logged
// both here and server-side (see routes/sync.ts) — lets a real production
// issue be traced end-to-end without ever needing to inspect a payload, let
// alone a customer's data.
let currentCorrelationId = ''
export function getCurrentCorrelationId(): string {
  return currentCorrelationId
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const credential = await getValidDeviceCredential()
  if (!credential) throw new Error('No valid device session — reconnect online to renew it')
  return fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${credential}`,
      'Content-Type': 'application/json',
      'X-Sync-Correlation-Id': currentCorrelationId,
    },
  })
}

interface PushResult { id: string; status: 'applied' | 'duplicate' | 'rejected' | 'pending_approval'; error?: string }

// Returns false when there's nothing left worth immediately retrying this
// cycle (either the queue is empty or the whole batch failed at the network
// level) — the caller uses this to stop looping rather than spin forever.
async function pushOnce(): Promise<boolean> {
  const pending = await offlineDb.outboxMutations.where('state').anyOf(['pending', 'failed']).limit(PUSH_BATCH_SIZE).toArray()
  if (!pending.length) return false

  const ids = pending.map(m => m.id)
  await offlineDb.outboxMutations.where('id').anyOf(ids).modify({ state: 'syncing' as OutboxState })

  let res: Response
  try {
    res = await authedFetch('/api/sync/v1/push', {
      method: 'POST',
      body: JSON.stringify({
        mutations: pending.map(m => ({ id: m.id, entity_type: m.entityType, operation: 'create', payload: m.payload })),
      }),
    })
  } catch {
    reportUnreachable()
    await offlineDb.outboxMutations.where('id').anyOf(ids).modify(m => {
      m.retryCount += 1
      m.state = m.retryCount >= FAILED_AFTER_RETRIES ? 'failed' : 'pending'
    })
    return false
  }

  if (!res.ok) {
    reportUnreachable()
    await offlineDb.outboxMutations.where('id').anyOf(ids).modify(m => {
      m.retryCount += 1
      m.state = m.retryCount >= FAILED_AFTER_RETRIES ? 'failed' : 'pending'
    })
    return false
  }

  reportReachable()
  const body = await res.json() as { data?: { results: PushResult[] } }
  const results = body.data?.results ?? []

  await offlineDb.transaction('rw', offlineDb.outboxMutations, offlineDb.salesLocal, async () => {
    for (const result of results) {
      const state: OutboxState = result.status === 'applied' || result.status === 'duplicate' ? 'synced'
        : result.status === 'pending_approval' ? 'pending_approval'
        : 'rejected'
      await offlineDb.outboxMutations.update(result.id, { state, lastError: result.error })

      const sale = await offlineDb.salesLocal.get(result.id)
      if (sale) {
        await offlineDb.salesLocal.update(result.id, {
          status: state === 'synced' ? 'synced' : state === 'rejected' ? 'rejected' : sale.status,
        })
      }
    }
  })

  notifyOutboxChanged()
  return true // there may be more queued — keep going this cycle
}

async function pullOnce(): Promise<void> {
  let cursor = (await offlineDb.syncMeta.get('cursor'))?.cursor ?? 0
  let hasMore = true

  while (hasMore) {
    const res = await authedFetch(`/api/sync/v1/pull?cursor=${cursor}&limit=${PULL_LIMIT}`)
    if (!res.ok) { reportUnreachable(); return }
    reportReachable()

    const body = await res.json() as {
      data: {
        changes: {
          products: Array<{ id: string; name: string; price: number; sale_price: number | null; stock: number; cost_price: number; is_active: number; category_id: string | null; updated_at: string }>
          customers: Array<{ id: string; name: string | null; phone: string; email: string | null; credit_limit: number; credit_balance: number }>
        }
        next_cursor: number
        has_more: boolean
      }
    }
    const { changes, next_cursor, has_more } = body.data

    await offlineDb.transaction('rw', offlineDb.productsCache, offlineDb.customersCache, offlineDb.syncMeta, async () => {
      for (const p of changes.products) {
        await offlineDb.productsCache.put({
          id: p.id, name: p.name, price: p.price, salePrice: p.sale_price, stock: p.stock,
          costPrice: p.cost_price, isActive: Boolean(p.is_active), categoryId: p.category_id, updatedAt: p.updated_at,
        })
      }
      for (const cu of changes.customers) {
        await offlineDb.customersCache.put({
          id: cu.id, name: cu.name, phone: cu.phone, email: cu.email,
          creditLimit: cu.credit_limit, creditBalance: cu.credit_balance,
        })
      }
      // The checkpoint only ever advances inside the same transaction that
      // committed the batch it points past — never before, so an
      // interruption mid-pull just re-fetches from the last committed cursor.
      await offlineDb.syncMeta.put({ id: 'cursor', cursor: next_cursor })
    })

    cursor = next_cursor
    hasMore = has_more
  }
}

async function doSyncCycle(): Promise<void> {
  await ensureDeviceRegistered() // cheap no-op unless renewal is actually due
  let keepGoing = true
  while (keepGoing) keepGoing = await pushOnce()
  await pullOnce()
  backoffMs = 2000 // a fully successful cycle resets backoff
}

export async function runSyncCycle(): Promise<void> {
  if (running) return
  running = true
  isSyncing.value = true
  currentCorrelationId = crypto.randomUUID()
  lastSyncAttemptAt.value = new Date().toISOString()
  try {
    const locks = (navigator as unknown as { locks?: { request: (name: string, opts: { ifAvailable: boolean }, cb: (lock: unknown) => Promise<void>) => Promise<void> } }).locks
    if (locks) {
      await locks.request('qesuite-pos-sync', { ifAvailable: true }, async (lock) => {
        if (!lock) return // another tab already owns this cycle
        await doSyncCycle()
      })
    } else {
      await doSyncCycle()
    }
    lastSyncSuccessAt.value = new Date().toISOString()
    lastSyncError.value = null
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    lastSyncError.value = message
    console.error(`[sync ${currentCorrelationId}]`, message)
    backoffMs = Math.min(MAX_BACKOFF_MS, backoffMs * 2) + Math.floor(Math.random() * 500)
    clearTimeout(retryTimer)
    retryTimer = setTimeout(() => void runSyncCycle(), backoffMs)
  } finally {
    running = false
    isSyncing.value = false
  }
}

let initialized = false
export function initSyncEngine(): void {
  if (initialized) return
  initialized = true

  void runSyncCycle() // on load / session restore
  window.addEventListener('online', () => void runSyncCycle()) // reconnect
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void runSyncCycle() // app became active again
  })
  onOutboxChanged(() => void runSyncCycle()) // after a local mutation (this or another tab)
  setInterval(() => void runSyncCycle(), 60_000) // periodic while online
}
