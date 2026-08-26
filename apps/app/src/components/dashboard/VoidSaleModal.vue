<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in">
      <div class="flex items-center justify-between border-b border-gray-100 p-3">
        <h3 class="text-base font-semibold text-gray-900">Void sale #{{ receiptCode }}</h3>
        <button @click="emit('close')" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="p-3">
        <p class="mb-2 text-xs leading-5 text-gray-500">
          This removes the sale from revenue and puts its items back in stock. Say why you're voiding it.
        </p>
        <textarea
          v-model="reason"
          rows="3"
          placeholder="e.g. Order entered by mistake, customer walked out"
          class="owner-input w-full resize-none"
        />
      </div>

      <div class="flex items-center justify-end gap-2 px-3 pb-3">
        <button @click="emit('close')" class="owner-secondary-action">
          Cancel
        </button>
        <button
          @click="handleVoid"
          :disabled="!reason.trim() || voiding"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          <svg v-if="voiding" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Void sale
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { usePosStore } from '@/stores/pos'

const props = defineProps<{ saleId: string; receiptCode: string }>()
const emit = defineEmits<{ close: []; voided: [] }>()

const posStore = usePosStore()
const reason = ref('')
const voiding = ref(false)

async function handleVoid() {
  if (!reason.value.trim()) return
  voiding.value = true
  const ok = await posStore.voidSale(props.saleId, reason.value.trim())
  voiding.value = false
  if (ok) {
    emit('voided')
    emit('close')
  }
}
</script>
