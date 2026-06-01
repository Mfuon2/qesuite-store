<template>
  <div class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div class="space-y-5">
      <section class="qs-card-soft p-4 sm:p-5">
        <div class="mb-4">
          <h3 class="text-base font-extrabold text-slate-950">Fulfilment options</h3>
          <p class="text-sm font-medium text-slate-500">Choose how customers receive orders.</p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            @click="form.delivery_enabled = !form.delivery_enabled"
            :class="[
              'rounded-2xl border p-4 text-left transition',
              form.delivery_enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
            ]"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
                <TruckIcon class="h-5 w-5" />
              </span>
              <span :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.delivery_enabled ? 'bg-emerald-700' : 'bg-slate-200']">
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.delivery_enabled ? 'translate-x-6' : 'translate-x-1']" />
              </span>
            </div>
            <p class="mt-3 text-sm font-extrabold">Delivery</p>
            <p class="mt-1 text-xs font-medium text-slate-500">Riders deliver to customer locations.</p>
          </button>

          <button
            @click="form.pickup_enabled = !form.pickup_enabled"
            :class="[
              'rounded-2xl border p-4 text-left transition',
              form.pickup_enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
            ]"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
                <BuildingStorefrontIcon class="h-5 w-5" />
              </span>
              <span :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.pickup_enabled ? 'bg-emerald-700' : 'bg-slate-200']">
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.pickup_enabled ? 'translate-x-6' : 'translate-x-1']" />
              </span>
            </div>
            <p class="mt-3 text-sm font-extrabold">Pickup</p>
            <p class="mt-1 text-xs font-medium text-slate-500">Customers collect from your store.</p>
          </button>
        </div>
      </section>

      <section v-if="form.delivery_enabled" class="qs-card-soft p-4 sm:p-5">
        <div class="mb-4">
          <h3 class="text-base font-extrabold text-slate-950">Delivery settings</h3>
          <p class="text-sm font-medium text-slate-500">Fees, area, speed, and order minimums.</p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="admin-label">Delivery Fee (KES)</label>
            <input v-model.number="form.delivery_fee" type="number" min="0" step="10" placeholder="150" class="admin-input" />
          </div>
          <div>
            <label class="admin-label">Delivery Radius (km)</label>
            <input v-model.number="form.delivery_radius_km" type="number" min="1" max="50" step="1" placeholder="10" class="admin-input" />
          </div>
          <div>
            <label class="admin-label">Estimated Delivery (minutes)</label>
            <input v-model.number="form.estimated_delivery_minutes" type="number" min="5" max="120" step="5" placeholder="30" class="admin-input" />
          </div>
          <div>
            <label class="admin-label">Min. Order Amount (KES)</label>
            <input v-model.number="form.min_order_amount" type="number" min="0" step="50" placeholder="0" class="admin-input" />
          </div>
          <div class="sm:col-span-2">
            <label class="admin-label">WhatsApp Business Number</label>
            <input v-model="form.whatsapp_number" type="tel" placeholder="+254700000000" class="admin-input" />
          </div>
        </div>
      </section>

      <section v-if="form.delivery_enabled" class="qs-card-soft p-4 sm:p-5">
        <div class="mb-4">
          <h3 class="flex items-center gap-2 text-base font-extrabold text-slate-950">
            <UserGroupIcon class="h-5 w-5 text-emerald-700" /> Delivery riders
          </h3>
          <p class="text-sm font-medium text-slate-500">Invite riders now or add them later from Delivery.</p>
        </div>

        <div class="flex gap-2">
          <input v-model="riderPhone" type="tel" placeholder="+254700000000" @keydown.enter="addRider" class="admin-input flex-1" />
          <button
            @click="addRider"
            :disabled="!riderPhone"
            class="h-10 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(20,132,71,0.18)] disabled:opacity-60"
          >
            Add
          </button>
        </div>

        <div v-if="riderPhones.length" class="mt-3 grid gap-2">
          <div
            v-for="(phone, i) in riderPhones"
            :key="i"
            class="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2"
          >
            <PhoneIcon class="h-4 w-4 shrink-0 text-emerald-700" />
            <span class="flex-1 font-mono text-sm font-bold text-emerald-800">{{ phone }}</span>
            <button @click="removeRider(i)" class="text-emerald-500 transition hover:text-red-500">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>

    <aside class="qs-card-soft h-fit p-4">
      <h4 class="text-sm font-extrabold text-slate-950">Launch summary</h4>
      <div class="mt-4 grid gap-3">
        <div class="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
          <span class="text-sm font-bold text-slate-600">Delivery</span>
          <span class="text-sm font-extrabold" :class="form.delivery_enabled ? 'text-emerald-700' : 'text-slate-400'">{{ form.delivery_enabled ? 'On' : 'Off' }}</span>
        </div>
        <div class="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
          <span class="text-sm font-bold text-slate-600">Pickup</span>
          <span class="text-sm font-extrabold" :class="form.pickup_enabled ? 'text-emerald-700' : 'text-slate-400'">{{ form.pickup_enabled ? 'On' : 'Off' }}</span>
        </div>
        <div v-if="form.delivery_enabled" class="rounded-2xl bg-emerald-50 p-3">
          <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Customer promise</p>
          <p class="mt-1 text-sm font-extrabold text-slate-950">{{ form.estimated_delivery_minutes }} min delivery</p>
          <p class="text-xs font-semibold text-slate-500">KES {{ form.delivery_fee.toLocaleString() }} fee · {{ form.delivery_radius_km }} km radius</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BuildingStorefrontIcon, PhoneIcon, TruckIcon, UserGroupIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const form = defineModel<{
  delivery_enabled: boolean
  pickup_enabled: boolean
  delivery_fee: number
  delivery_radius_km: number
  estimated_delivery_minutes: number
  min_order_amount: number
  whatsapp_number: string
}>({ required: true })

const emit = defineEmits<{ 'update:riderPhones': [phones: string[]] }>()

const riderPhone = ref('')
const riderPhones = ref<string[]>([])

function addRider() {
  const phone = riderPhone.value.trim()
  if (!phone || riderPhones.value.includes(phone)) return
  riderPhones.value.push(phone)
  riderPhone.value = ''
  emit('update:riderPhones', riderPhones.value)
}

function removeRider(i: number) {
  riderPhones.value.splice(i, 1)
  emit('update:riderPhones', riderPhones.value)
}
</script>
