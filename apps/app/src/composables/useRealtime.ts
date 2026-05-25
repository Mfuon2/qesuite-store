import { ref, onUnmounted } from 'vue'

type RealtimeStatus = 'connected' | 'reconnecting' | 'disconnected'

export function useRealtime(tenantId: string) {
  const status = ref<RealtimeStatus>('disconnected')
  let channel: { unsubscribe: () => void } | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  async function connect(handlers: {
    onInsert?: (table: string, record: unknown) => void
    onUpdate?: (table: string, record: unknown) => void
  }) {
    if (!supabaseUrl || !supabaseKey) return

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const tables = ['orders', 'delivery_assignments']

      let ch = supabase.channel(`dashboard:${tenantId}`)

      for (const table of tables) {
        ch = ch
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table,
            filter: `tenant_id=eq.${tenantId}`
          }, (payload: { new: unknown }) => {
            handlers.onInsert?.(table, payload.new)
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter: `tenant_id=eq.${tenantId}`
          }, (payload: { new: unknown }) => {
            handlers.onUpdate?.(table, payload.new)
          })
      }

      channel = ch.subscribe((s: string) => {
        if (s === 'SUBSCRIBED') status.value = 'connected'
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
          status.value = 'reconnecting'
          scheduleReconnect(handlers)
        } else if (s === 'CLOSED') {
          status.value = 'disconnected'
        }
      }) as unknown as { unsubscribe: () => void }
    } catch {
      status.value = 'disconnected'
    }
  }

  function scheduleReconnect(handlers: Parameters<typeof connect>[0]) {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => connect(handlers), 5000)
  }

  function disconnect() {
    channel?.unsubscribe()
    channel = null
    if (reconnectTimer) clearTimeout(reconnectTimer)
    status.value = 'disconnected'
  }

  onUnmounted(disconnect)

  return { status, connect, disconnect }
}
