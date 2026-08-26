<template>
  <Transition name="fade">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" @click.self="$emit('cancel')">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('cancel')" />

      <div class="relative w-full max-w-md bg-white  rounded-2xl shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 px-3 py-3">
          <div class="flex items-center gap-2.5">
            <div class="rounded-lg bg-emerald-50 p-1.5">
              <BanknotesIcon class="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 class="text-base font-bold text-gray-900 ">Record Payment</h2>
              <p class="text-xs text-gray-400">Order #{{ trackingCode }}</p>
            </div>
          </div>
          <button @click="$emit('cancel')" class="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100  transition-colors">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="space-y-3 p-3">
          <!-- Amount (read-only) -->
          <div>
            <p class="text-xs font-semibold text-gray-500  uppercase tracking-wide mb-1.5">Amount Due</p>
            <div class="rounded-xl bg-gray-50 px-3 py-2">
              <span class="text-base font-bold text-gray-900">KES {{ total.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Payment method -->
          <div>
            <p class="text-xs font-semibold text-gray-500  uppercase tracking-wide mb-1.5">Payment Method</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="m in methods"
                :key="m.value"
                @click="method = m.value"
                :class="[
                  'flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs font-semibold transition-all',
                  method === m.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200  text-gray-500  hover:border-gray-300 '
                ]"
              >
                <component :is="m.icon" class="h-4 w-4" />
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Reference -->
          <div>
            <label class="text-xs font-semibold text-gray-500  uppercase tracking-wide mb-1.5 block">
              Payment Reference
              <span v-if="method === 'mpesa'" class="normal-case font-normal text-gray-400"> — M-Pesa confirmation code</span>
              <span v-else-if="method === 'cash'" class="normal-case font-normal text-gray-400"> — receipt no. (optional)</span>
              <span v-else class="normal-case font-normal text-gray-400"> — transaction ref (optional)</span>
            </label>
            <input
              v-model="reference"
              :placeholder="method === 'mpesa' ? 'e.g. QGR7Y8ZX2F' : 'Optional'"
              class="owner-input"
              @keydown.enter="confirm"
            />
          </div>

          <!-- Note (optional) -->
          <div>
            <label class="text-xs font-semibold text-gray-500  uppercase tracking-wide mb-1.5 block">Note <span class="normal-case font-normal text-gray-400">(optional)</span></label>
            <input
              v-model="note"
              placeholder="e.g. Paid at door"
              class="owner-input"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-2 px-3 pb-3">
          <button
            @click="$emit('cancel')"
            class="owner-secondary-action flex-1"
          >
            Cancel
          </button>
          <button
            @click="confirm"
            :disabled="loading || (method === 'mpesa' && !reference.trim())"
            class="owner-primary-action flex-1"
          >
            <span v-if="loading" class="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BanknotesIcon, XMarkIcon, CheckIcon, DevicePhoneMobileIcon, CreditCardIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  trackingCode: string
  total: number
  defaultMethod?: string
}>()

const emit = defineEmits<{
  confirm: [payload: { reference: string; note: string; method: string }]
  cancel: []
}>()

const method = ref(props.defaultMethod === 'mpesa' ? 'mpesa' : 'cash')
const reference = ref('')
const note = ref('')
const loading = ref(false)

const methods = [
  { value: 'cash', label: 'Cash', icon: BanknotesIcon },
  { value: 'mpesa', label: 'M-Pesa', icon: DevicePhoneMobileIcon },
  { value: 'card', label: 'Card', icon: CreditCardIcon },
]

function confirm() {
  if (method.value === 'mpesa' && !reference.value.trim()) return
  loading.value = true
  emit('confirm', {
    reference: reference.value.trim(),
    note: note.value.trim(),
    method: method.value,
  })
}
</script>
