import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMyOrders, updateAssignmentStatus, pingLocation as pingLocationApi, type AssignedOrder } from '@/api/delivery'

export interface AssignmentWithDistance extends AssignedOrder {
  distanceKm?: number
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const useOrdersStore = defineStore('deliveryOrders', () => {
  const orders = ref<AssignedOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentLat = ref<number | null>(null)
  const currentLng = ref<number | null>(null)

  const activeOrders = computed(() =>
    orders.value.filter((o) => o.assignment_status !== 'DELIVERED' && o.assignment_status !== 'FAILED')
  )

  const sortedOrders = computed<AssignmentWithDistance[]>(() => {
    const lat = currentLat.value
    const lng = currentLng.value
    return [...orders.value]
      .map((o) => {
        const distanceKm =
          lat !== null && lng !== null && o.delivery_lat != null && o.delivery_lng != null
            ? haversineKm(lat, lng, o.delivery_lat, o.delivery_lng)
            : undefined
        return { ...o, distanceKm }
      })
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0
        if (a.distanceKm == null) return 1
        if (b.distanceKm == null) return -1
        return a.distanceKm - b.distanceKm
      })
  })

  async function fetchOrders(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      orders.value = await getMyOrders()
    } catch (err: unknown) {
      const e = err as { message?: string }
      error.value = e.message || 'Failed to load orders'
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(assignmentId: string, status: string, failureReason?: string): Promise<void> {
    await updateAssignmentStatus(assignmentId, status, failureReason)
    const idx = orders.value.findIndex((o) => o.assignment_id === assignmentId)
    if (idx !== -1) {
      orders.value[idx] = { ...orders.value[idx], assignment_status: status }
    }
  }

  async function pingLocation(lat: number, lng: number): Promise<void> {
    currentLat.value = lat
    currentLng.value = lng
    try {
      await pingLocationApi(lat, lng)
    } catch { /* best-effort */ }
  }

  function getOrderById(id: string): AssignedOrder | undefined {
    return orders.value.find((o) => o.order_id === id)
  }

  return {
    orders,
    loading,
    error,
    currentLat,
    currentLng,
    activeOrders,
    sortedOrders,
    fetchOrders,
    updateStatus,
    pingLocation,
    getOrderById,
  }
})
