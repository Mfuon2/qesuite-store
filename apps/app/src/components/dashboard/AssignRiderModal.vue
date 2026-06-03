<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white  rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 ">
        <h3 class="text-lg font-semibold text-gray-900 ">Assign Rider</h3>
        <button @click="emit('close')" class="p-1.5 text-gray-400 hover:text-gray-600  hover:bg-gray-100  rounded-lg transition-colors">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="p-5">
        <p class="text-sm text-gray-500  mb-4">
          Select a rider for Order #{{ orderId }}
        </p>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-16 rounded-xl" />
        </div>

        <div v-else-if="riders.length === 0" class="text-center py-8 text-gray-400 ">
          <TruckIcon class="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p class="text-sm">No active riders available</p>
        </div>

        <div v-else class="space-y-2 max-h-72 overflow-y-auto">
          <button
            v-for="rider in riders"
            :key="rider.id"
            @click="selectedRiderId = rider.id"
            :class="[
              'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
              selectedRiderId === rider.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-100  hover:border-gray-200 '
            ]"
          >
            <div class="w-10 h-10 bg-gray-100  rounded-full flex items-center justify-center shrink-0">
              <span class="text-sm font-semibold text-gray-600 ">{{ rider.name[0].toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900  text-sm">{{ rider.name }}</p>
              <p class="text-xs text-gray-400 ">{{ rider.phone }} · {{ vehicleLabel(rider.vehicle_type) }}</p>
            </div>
            <div v-if="selectedRiderId === rider.id" class="shrink-0">
              <CheckCircleIcon class="w-5 h-5 text-primary" />
            </div>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-5 pb-5">
        <button @click="emit('close')" class="px-4 py-2 text-sm text-gray-600  bg-gray-100  hover:bg-gray-200  rounded-xl font-medium transition-colors">
          Cancel
        </button>
        <button
          @click="handleAssign"
          :disabled="!selectedRiderId || assigning"
          class="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
        >
          <svg v-if="assigning" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Assign Rider
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XMarkIcon, CheckCircleIcon, TruckIcon } from '@heroicons/vue/24/outline'
import { apiGetDeliveryStaff } from '@/api/delivery'
import { useOrdersStore } from '@/stores/orders'
import type { DeliveryStaff, VehicleType } from '@qesuite/types'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{
  close: []
  assigned: []
}>()

const riders = ref<DeliveryStaff[]>([])
const loading = ref(true)
const selectedRiderId = ref<string | null>(null)
const assigning = ref(false)
const ordersStore = useOrdersStore()

function vehicleLabel(v: VehicleType | null) {
  const labels: Record<VehicleType, string> = { bicycle: 'Bicycle', motorcycle: 'Motorcycle', car: 'Car', on_foot: 'On Foot' }
  return v ? labels[v] : 'Unknown vehicle'
}

async function handleAssign() {
  if (!selectedRiderId.value) return
  assigning.value = true
  await ordersStore.assignRider(props.orderId, selectedRiderId.value)
  assigning.value = false
  emit('assigned')
  emit('close')
}

onMounted(async () => {
  try {
    const res = await apiGetDeliveryStaff()
    if (res.success && res.data) riders.value = res.data.filter(r => r.is_active)
  } finally {
    loading.value = false
  }
})
</script>
