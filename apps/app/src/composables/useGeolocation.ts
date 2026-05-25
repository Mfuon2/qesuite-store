import { ref, onMounted, onUnmounted } from 'vue'
import { useOrdersStore } from '@/stores/deliveryOrders'

export function useGeolocation() {
  const lat = ref<number | null>(null)
  const lng = ref<number | null>(null)
  const accuracy = ref<number | null>(null)
  const error = ref<string | null>(null)
  const isActive = ref(false)
  const lastUpdate = ref<Date | null>(null)

  let watchId: number | null = null
  let pingInterval: ReturnType<typeof setInterval> | null = null

  function onSuccess(pos: GeolocationPosition) {
    lat.value = pos.coords.latitude
    lng.value = pos.coords.longitude
    accuracy.value = pos.coords.accuracy
    isActive.value = true
    error.value = null
    lastUpdate.value = new Date()
  }

  function onError(err: GeolocationPositionError) {
    isActive.value = false
    switch (err.code) {
      case err.PERMISSION_DENIED:
        error.value = 'GPS permission denied'
        break
      case err.POSITION_UNAVAILABLE:
        error.value = 'GPS unavailable'
        break
      case err.TIMEOUT:
        error.value = 'GPS timeout'
        break
      default:
        error.value = 'GPS error'
    }
  }

  function start() {
    if (!('geolocation' in navigator)) {
      error.value = 'GPS not supported'
      return
    }

    watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    })

    // Ping API every 30 seconds when we have a location
    const ordersStore = useOrdersStore()
    pingInterval = setInterval(() => {
      if (lat.value !== null && lng.value !== null) {
        ordersStore.pingLocation(lat.value, lng.value)
      }
    }, 30_000)
  }

  function stop() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    if (pingInterval !== null) {
      clearInterval(pingInterval)
      pingInterval = null
    }
    isActive.value = false
  }

  onMounted(() => start())
  onUnmounted(() => stop())

  return { lat, lng, accuracy, error, isActive, lastUpdate, start, stop }
}
