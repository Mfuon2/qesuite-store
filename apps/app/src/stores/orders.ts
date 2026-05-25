import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetOrders, apiGetOrder, apiUpdateOrderStatus, apiGetPackingSlip, apiAssignRider } from '@/api/orders'
import type { Order, OrderStatus, OrderFilters } from '@qesuite/types'
import { useOrderSound } from '@/composables/useOrderSound'
import { useToast } from '@/composables/useToast'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const loadingDetail = ref(false)
  const filter = ref<OrderStatus | 'ALL'>('ALL')
  const realtimeConnected = ref(false)
  const packingSlipText = ref<string>('')
  const { playPing } = useOrderSound()
  const { showToast } = useToast()

  let realtimeChannel: { unsubscribe: () => void } | null = null

  async function fetchOrders(status?: OrderStatus | 'ALL') {
    loading.value = true
    try {
      const params: OrderFilters = { limit: 100 }
      if (status && status !== 'ALL') params.status = status
      const res = await apiGetOrders(params)
      orders.value = res.data || []
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load orders', 'error')
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(id: string) {
    loadingDetail.value = true
    try {
      const res = await apiGetOrder(id)
      if (res.success && res.data) {
        currentOrder.value = res.data
        // Update in list
        const idx = orders.value.findIndex(o => o.id === id)
        if (idx !== -1) orders.value[idx] = res.data
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load order', 'error')
    } finally {
      loadingDetail.value = false
    }
  }

  async function updateOrderStatus(id: string, status: OrderStatus, reason?: string) {
    try {
      const res = await apiUpdateOrderStatus(id, { status, cancellation_reason: reason })
      if (res.success && res.data) {
        const idx = orders.value.findIndex(o => o.id === id)
        if (idx !== -1) orders.value[idx] = res.data
        if (currentOrder.value?.id === id) currentOrder.value = res.data
        showToast('Order status updated', 'success')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update order', 'error')
    }
  }

  async function assignRider(orderId: string, staffId: string) {
    try {
      const res = await apiAssignRider(orderId, staffId)
      if (res.success) {
        await fetchOrder(orderId)
        showToast('Rider assigned successfully', 'success')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to assign rider', 'error')
    }
  }

  async function fetchPackingSlip(id: string) {
    try {
      const res = await apiGetPackingSlip(id)
      if (res.success && res.data) packingSlipText.value = res.data.text
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load packing slip', 'error')
    }
  }

  function handleNewOrder(order: Order) {
    orders.value.unshift(order)
    playPing()
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order!', {
        body: `Order #${order.tracking_code} - ${order.customer_name || order.customer_phone}`,
        icon: '/favicon.svg'
      })
    }
    showToast(`New order #${order.tracking_code}!`, 'info')
  }

  function subscribeRealtime(tenantId: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return

    // Dynamic import to avoid bundling Supabase if not configured
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(supabaseUrl, supabaseKey)
      realtimeChannel = supabase
        .channel(`orders:${tenantId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`
        }, (payload: { new: Order }) => {
          handleNewOrder(payload.new)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`
        }, (payload: { new: Order }) => {
          const idx = orders.value.findIndex(o => o.id === payload.new.id)
          if (idx !== -1) orders.value[idx] = payload.new
          if (currentOrder.value?.id === payload.new.id) currentOrder.value = payload.new
        })
        .subscribe((status: string) => {
          realtimeConnected.value = status === 'SUBSCRIBED'
        }) as unknown as { unsubscribe: () => void }
    }).catch(() => {
      // Supabase not installed, skip realtime
    })
  }

  function unsubscribeRealtime() {
    realtimeChannel?.unsubscribe()
    realtimeChannel = null
    realtimeConnected.value = false
  }

  return {
    orders,
    currentOrder,
    loading,
    loadingDetail,
    filter,
    realtimeConnected,
    packingSlipText,
    fetchOrders,
    fetchOrder,
    updateOrderStatus,
    assignRider,
    fetchPackingSlip,
    subscribeRealtime,
    unsubscribeRealtime
  }
})
