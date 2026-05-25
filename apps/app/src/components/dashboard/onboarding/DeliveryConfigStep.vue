<template>
  <div class="space-y-3 max-w-2xl">
    <!-- Delivery toggle -->
    <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
        <TruckIcon class="w-4 h-4 text-primary" /> Delivery Options
      </h3>

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Delivery</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">Riders will deliver to customers</p>
        </div>
        <button
          @click="form.delivery_enabled = !form.delivery_enabled"
          :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.delivery_enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600']"
        >
          <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.delivery_enabled ? 'translate-x-6' : 'translate-x-1']" />
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Pickup</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">Customers pick up from your store</p>
        </div>
        <button
          @click="form.pickup_enabled = !form.pickup_enabled"
          :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.pickup_enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600']"
        >
          <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.pickup_enabled ? 'translate-x-6' : 'translate-x-1']" />
        </button>
      </div>
    </div>

    <!-- Delivery details -->
    <div v-if="form.delivery_enabled" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">Delivery Settings</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Delivery Fee (KES)</label>
          <input
            v-model.number="form.delivery_fee"
            type="number"
            min="0"
            step="10"
            placeholder="150"
            class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Delivery Radius (km)</label>
          <input
            v-model.number="form.delivery_radius_km"
            type="number"
            min="1"
            max="50"
            step="1"
            placeholder="10"
            class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estimated Delivery (minutes)</label>
          <input
            v-model.number="form.estimated_delivery_minutes"
            type="number"
            min="5"
            max="120"
            step="5"
            placeholder="30"
            class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min. Order Amount (KES)</label>
          <input
            v-model.number="form.min_order_amount"
            type="number"
            min="0"
            step="50"
            placeholder="0"
            class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">WhatsApp Business Number</label>
        <input
          v-model="form.whatsapp_number"
          type="tel"
          placeholder="+254700000000"
          class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">For order notifications via WhatsApp</p>
      </div>
    </div>

    <!-- Invite riders -->
    <div v-if="form.delivery_enabled" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <div>
        <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <UserGroupIcon class="w-4 h-4 text-primary" /> Invite Delivery Riders
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">We'll send them a magic link to download the delivery app</p>
      </div>

      <div class="flex gap-2">
        <input
          v-model="riderPhone"
          type="tel"
          placeholder="+254700000000"
          @keydown.enter="addRider"
          class="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <button
          @click="addRider"
          :disabled="!riderPhone"
          class="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          Add
        </button>
      </div>

      <div v-if="riderPhones.length" class="space-y-2">
        <div
          v-for="(phone, i) in riderPhones"
          :key="i"
          class="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
        >
          <PhoneIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span class="text-sm font-mono text-emerald-700 dark:text-emerald-300 flex-1">{{ phone }}</span>
          <button @click="removeRider(i)" class="text-emerald-400 hover:text-red-500 transition-colors">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TruckIcon, UserGroupIcon, PhoneIcon, XMarkIcon } from '@heroicons/vue/24/outline'

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
