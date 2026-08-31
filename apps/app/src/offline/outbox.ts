import { offlineDb } from './db'

// Cheap cross-tab awareness: if the POS is accidentally opened in a second
// tab, both tabs learn immediately when the outbox changes (a new mutation
// queued, or the sync engine advancing one), without either tab polling.
// This is purely a notification channel — it carries no data, and neither
// tab acts on a message from itself.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('qesuite-pos-sync') : null

export function notifyOutboxChanged(): void {
  channel?.postMessage({ type: 'outbox-changed' })
}

export function onOutboxChanged(cb: () => void): () => void {
  if (!channel) return () => {}
  const handler = (e: MessageEvent) => { if (e.data?.type === 'outbox-changed') cb() }
  channel.addEventListener('message', handler)
  return () => channel.removeEventListener('message', handler)
}

export async function pendingMutationCount(): Promise<number> {
  return offlineDb.outboxMutations.where('state').anyOf(['pending', 'failed', 'syncing']).count()
}

export async function failedMutationCount(): Promise<number> {
  return offlineDb.outboxMutations.where('state').equals('failed').count()
}

export async function conflictMutationCount(): Promise<number> {
  return offlineDb.outboxMutations.where('state').anyOf(['conflict', 'pending_approval']).count()
}
