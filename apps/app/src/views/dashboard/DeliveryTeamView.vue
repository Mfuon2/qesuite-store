<template>
  <div class="owner-page">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <div class="owner-eyebrow">Delivery operations</div>
          <h1 class="owner-title">Delivery Team</h1>
          <p class="owner-subtitle">
            Invite riders, keep contact details close, and control who can receive delivery assignments.
          </p>
        </div>
        <button @click="showAddForm = true" class="owner-primary-action">
          <PlusIcon class="h-4 w-4" />
          Add rider
        </button>
      </div>
    </section>

    <section class="owner-stat-grid">
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <TruckIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ riders.length }}</p>
          <p class="text-xs font-medium text-slate-500">Total riders</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <CheckCircleIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ activeRiders }}</p>
          <p class="text-xs font-medium text-slate-500">Active</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-slate-50 text-slate-600 ring-slate-100">
          <NoSymbolIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ inactiveRiders }}</p>
          <p class="text-xs font-medium text-slate-500">Inactive</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-sky-50 text-sky-700 ring-sky-100">
          <PhoneIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ ridersWithLocation }}</p>
          <p class="text-xs font-medium text-slate-500">Recently tracked</p>
        </div>
      </div>
    </section>

    <!-- Edit rider form -->
    <Transition name="slide">
      <section v-if="editingRider" class="owner-soft-form mt-5">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="flex items-center gap-2 text-base font-bold text-slate-950">
              <PencilIcon class="h-5 w-5 text-primary" />
              Edit rider — {{ editingRider.name }}
            </h2>
            <p class="mt-1 text-sm font-medium text-slate-500">Update the rider's name, phone number, or vehicle type.</p>
          </div>
          <button @click="cancelEdit" class="owner-icon-button h-10 w-10">
            <NoSymbolIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <input v-model="editForm.name" type="text" placeholder="Full name" required class="owner-input" />
          <input v-model="editForm.phone" type="tel" placeholder="+254700000000" required class="owner-input" />
          <select v-model="editForm.vehicle_type" class="owner-select w-full">
            <option value="">Vehicle type</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car</option>
            <option value="on_foot">On Foot</option>
          </select>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button @click="cancelEdit" class="owner-secondary-action">Cancel</button>
          <button
            @click="saveRider"
            :disabled="!editForm.name || !editForm.phone || savingRider"
            class="owner-primary-action"
          >
            <svg v-if="savingRider" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Save changes
          </button>
        </div>
      </section>
    </Transition>

    <Transition name="slide">
      <section v-if="showAddForm" class="owner-soft-form mt-5">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="flex items-center gap-2 text-base font-bold text-slate-950">
              <UserPlusIcon class="h-5 w-5 text-primary" />
              Invite new rider
            </h2>
            <p class="mt-1 text-sm font-medium text-slate-500">A magic link will be sent by SMS after the rider is added.</p>
          </div>
          <button @click="showAddForm = false; newRider = { name: '', phone: '', vehicle_type: '' }" class="owner-icon-button h-10 w-10">
            <NoSymbolIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <input v-model="newRider.name" type="text" placeholder="Full name" required class="owner-input" />
          <input v-model="newRider.phone" type="tel" placeholder="+254700000000" required class="owner-input" />
          <select v-model="newRider.vehicle_type" class="owner-select w-full">
            <option value="">Vehicle type</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car</option>
            <option value="on_foot">On Foot</option>
          </select>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="flex items-center gap-2 text-xs font-medium text-slate-500">
            <InformationCircleIcon class="h-4 w-4 shrink-0" />
            Rider sign-in stays passwordless through the delivery app magic link.
          </p>
          <div class="flex justify-end gap-2">
            <button @click="showAddForm = false; newRider = { name: '', phone: '', vehicle_type: '' }" class="owner-secondary-action">
              Cancel
            </button>
            <button @click="addRider" :disabled="!newRider.name || !newRider.phone || addingRider" class="owner-primary-action">
              <svg v-if="addingRider" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Send invite
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <section class="mt-5">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-20 rounded-[22px]" />
      </div>

      <div v-else-if="!riders.length" class="owner-empty">
        <TruckIcon class="mx-auto mb-4 h-14 w-14 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No riders yet</p>
        <p class="mt-1 text-sm text-slate-500">Add riders to handle customer deliveries.</p>
      </div>

      <div v-else class="owner-panel space-y-2 p-2 sm:p-2">
        <div
          v-for="rider in riders"
          :key="rider.id"
          class="owner-list-row flex items-center gap-4"
        >
          <div class="relative shrink-0">
            <div class="owner-brand-surface flex h-12 w-12 items-center justify-center rounded-2xl text-primary ring-1">
              <span class="text-base font-black">{{ rider.name[0].toUpperCase() }}</span>
            </div>
            <span :class="['absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white', rider.is_active ? 'bg-emerald-500' : 'bg-slate-300']" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-slate-950">{{ rider.name }}</p>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <a :href="`tel:${rider.phone}`" class="flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-accent">
                <PhoneIcon class="h-3.5 w-3.5" /> {{ rider.phone }}
              </a>
              <span v-if="rider.vehicle_type" class="text-xs font-medium text-slate-500">{{ vehicleLabel(rider.vehicle_type) }}</span>
            </div>
            <p v-if="rider.location_updated_at" class="mt-0.5 text-xs font-medium text-slate-400">
              Last seen {{ timeAgo(rider.location_updated_at) }}
            </p>
          </div>

          <div class="hidden sm:flex">
            <span :class="['rounded-full px-2.5 py-1 text-xs font-bold', rider.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500']">
              {{ rider.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <button
              @click="startEdit(rider)"
              class="owner-action-icon"
              title="Edit rider"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              @click="sendLink(rider.id)"
              class="owner-action-icon"
              title="Resend magic link"
            >
              <LinkIcon class="h-4 w-4" />
            </button>
            <button
              @click="toggleRider(rider)"
              :class="['owner-action-icon', rider.is_active ? 'hover:bg-amber-50 hover:text-amber-500' : 'hover:text-primary']"
              :title="rider.is_active ? 'Deactivate' : 'Reactivate'"
            >
              <component :is="rider.is_active ? NoSymbolIcon : CheckCircleIcon" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { timeAgo } from '@/composables/useDateFormat'
import { PlusIcon, PhoneIcon, TruckIcon, UserPlusIcon, LinkIcon, InformationCircleIcon, CheckCircleIcon, NoSymbolIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { apiGetDeliveryStaff, apiCreateDeliveryStaff, apiUpdateDeliveryStaff, apiSendMagicLink } from '@/api/delivery'
import { useToast } from '@/composables/useToast'
import type { DeliveryStaff, VehicleType } from '@qesuite/types'

const { showToast } = useToast()
const riders = ref<DeliveryStaff[]>([])
const loading = ref(true)
const showAddForm = ref(false)
const addingRider = ref(false)
const newRider = ref({ name: '', phone: '', vehicle_type: '' })

// Edit state
const editingRider = ref<DeliveryStaff | null>(null)
const savingRider = ref(false)
const editForm = ref({ name: '', phone: '', vehicle_type: '' })

function startEdit(rider: DeliveryStaff) {
  editingRider.value = rider
  editForm.value = { name: rider.name, phone: rider.phone, vehicle_type: rider.vehicle_type ?? '' }
  showAddForm.value = false // close add form if open
  // Scroll the edit form into view
  setTimeout(() => document.querySelector('.owner-soft-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
}

function cancelEdit() {
  editingRider.value = null
  editForm.value = { name: '', phone: '', vehicle_type: '' }
}

async function saveRider() {
  if (!editingRider.value || !editForm.value.name || !editForm.value.phone) return
  savingRider.value = true
  try {
    const res = await apiUpdateDeliveryStaff(editingRider.value.id, {
      name: editForm.value.name,
      phone: editForm.value.phone,
      vehicle_type: (editForm.value.vehicle_type as VehicleType) || undefined,
    })
    if (res.success && res.data) {
      const idx = riders.value.findIndex(r => r.id === editingRider.value!.id)
      if (idx !== -1) riders.value[idx] = res.data
      showToast('Rider details updated', 'success')
      cancelEdit()
    }
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Failed to update rider', 'error')
  } finally {
    savingRider.value = false
  }
}
const activeRiders = computed(() => riders.value.filter(rider => rider.is_active).length)
const inactiveRiders = computed(() => riders.value.length - activeRiders.value)
const ridersWithLocation = computed(() => riders.value.filter(rider => rider.location_updated_at).length)

const vehicleLabels: Record<VehicleType, string> = { bicycle: 'Bicycle', motorcycle: 'Motorcycle', car: 'Car', on_foot: 'On Foot' }
function vehicleLabel(v: VehicleType | null) { return v ? vehicleLabels[v] : '' }

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
