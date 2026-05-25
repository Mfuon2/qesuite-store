<template>
  <div class="p-3 sm:p-4 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div>
        <h2 class="text-base font-bold text-gray-900 dark:text-white">Delivery Team</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ riders.length }} riders</p>
      </div>
      <button @click="showAddForm = true" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
        <PlusIcon class="w-4 h-4" />
        Add Rider
      </button>
    </div>

    <!-- Add rider form -->
    <Transition name="slide">
      <div v-if="showAddForm" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserPlusIcon class="w-5 h-5 text-primary" />
          Invite New Rider
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input v-model="newRider.name" type="text" placeholder="Full name" required
            class="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          <input v-model="newRider.phone" type="tel" placeholder="+254700000000" required
            class="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          <select v-model="newRider.vehicle_type"
            class="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
            <option value="">Vehicle type</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car</option>
            <option value="on_foot">On Foot</option>
          </select>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
          <InformationCircleIcon class="w-4 h-4 shrink-0" />
          A magic link will be sent via SMS to download the delivery app
        </p>
        <div class="flex gap-2 mt-3 justify-end">
          <button @click="showAddForm = false; newRider = { name: '', phone: '', vehicle_type: '' }" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button @click="addRider" :disabled="!newRider.name || !newRider.phone || addingRider"
            class="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center gap-2 transition-opacity">
            <svg v-if="addingRider" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Send Invite
          </button>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="skeleton h-20 rounded-2xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!riders.length" class="text-center py-16 text-gray-400 dark:text-gray-500">
      <TruckIcon class="w-16 h-16 mx-auto mb-4 opacity-30" />
      <p class="font-medium">No riders yet</p>
      <p class="text-sm mt-1">Add riders to handle deliveries</p>
    </div>

    <!-- Rider list -->
    <div v-else class="space-y-3">
      <div
        v-for="rider in riders"
        :key="rider.id"
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:border-gray-200 dark:hover:border-gray-600 transition-all"
      >
        <div class="relative shrink-0">
          <div class="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center">
            <span class="text-primary font-bold text-base">{{ rider.name[0].toUpperCase() }}</span>
          </div>
          <span :class="['absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800', rider.is_active ? 'bg-emerald-500' : 'bg-gray-300']" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ rider.name }}</p>
          <div class="flex items-center gap-3 mt-0.5">
            <a :href="`tel:${rider.phone}`" class="text-xs text-primary font-mono hover:text-accent transition-colors flex items-center gap-1">
              <PhoneIcon class="w-3.5 h-3.5" /> {{ rider.phone }}
            </a>
            <span v-if="rider.vehicle_type" class="text-xs text-gray-400">{{ vehicleLabel(rider.vehicle_type) }}</span>
          </div>
          <p v-if="rider.location_updated_at" class="text-xs text-gray-400 mt-0.5">
            Last seen {{ timeAgo(rider.location_updated_at) }}
          </p>
        </div>

        <div class="hidden sm:flex items-center">
          <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', rider.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400']">
            {{ rider.is_active ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button
            @click="sendLink(rider.id)"
            class="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
            title="Resend magic link"
          >
            <LinkIcon class="w-4 h-4" />
          </button>
          <button
            @click="toggleRider(rider)"
            :class="['p-2 rounded-xl transition-colors', rider.is_active ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20']"
            :title="rider.is_active ? 'Deactivate' : 'Reactivate'"
          >
            <component :is="rider.is_active ? NoSymbolIcon : CheckCircleIcon" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PhoneIcon, TruckIcon, UserPlusIcon, LinkIcon, InformationCircleIcon, CheckCircleIcon, NoSymbolIcon } from '@heroicons/vue/24/outline'
import { apiGetDeliveryStaff, apiCreateDeliveryStaff, apiUpdateDeliveryStaff, apiSendMagicLink } from '@/api/delivery'
import { useToast } from '@/composables/useToast'
import type { DeliveryStaff, VehicleType } from '@qesuite/types'

const { showToast } = useToast()
const riders = ref<DeliveryStaff[]>([])
const loading = ref(true)
const showAddForm = ref(false)
const addingRider = ref(false)
const newRider = ref({ name: '', phone: '', vehicle_type: '' })

const vehicleLabels: Record<VehicleType, string> = { bicycle: 'Bicycle', motorcycle: 'Motorcycle', car: 'Car', on_foot: 'On Foot' }
function vehicleLabel(v: VehicleType | null) { return v ? vehicleLabels[v] : '' }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

async function loadRiders() {
  loading.value = true
  try {
    const res = await apiGetDeliveryStaff()
    if (res.success && res.data) riders.value = res.data
  } finally {
    loading.value = false
  }
}

async function addRider() {
  if (!newRider.value.name || !newRider.value.phone) return
  addingRider.value = true
  try {
    const res = await apiCreateDeliveryStaff({
      name: newRider.value.name,
      phone: newRider.value.phone,
      vehicle_type: newRider.value.vehicle_type as VehicleType || undefined
    })
    if (res.success && res.data) {
      riders.value.push(res.data)
      await apiSendMagicLink(res.data.id)
      showToast('Rider added and invite sent!', 'success')
      showAddForm.value = false
      newRider.value = { name: '', phone: '', vehicle_type: '' }
    }
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Failed to add rider', 'error')
  } finally {
    addingRider.value = false
  }
}

async function toggleRider(rider: DeliveryStaff) {
  const res = await apiUpdateDeliveryStaff(rider.id, { is_active: !rider.is_active })
  if (res.success && res.data) {
    const idx = riders.value.findIndex(r => r.id === rider.id)
    if (idx !== -1) riders.value[idx] = res.data
    showToast(res.data.is_active ? 'Rider reactivated' : 'Rider deactivated', 'success')
  }
}

async function sendLink(id: string) {
  try {
    await apiSendMagicLink(id)
    showToast('Magic link sent!', 'success')
  } catch {
    showToast('Failed to send link', 'error')
  }
}

onMounted(loadRiders)
</script>
