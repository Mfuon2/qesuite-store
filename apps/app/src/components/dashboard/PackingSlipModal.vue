<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-primary" />
          Packing Slip
        </h3>
        <button @click="emit('close')" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 8" :key="i" class="skeleton h-4 rounded" />
        </div>
        <pre v-else class="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{{ text }}</pre>
      </div>

      <div class="flex items-center gap-3 px-5 pb-5">
        <button @click="download" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors">
          <ArrowDownTrayIcon class="w-4 h-4" />
          Download .txt
        </button>
        <button @click="print" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
          <PrinterIcon class="w-4 h-4" />
          Print
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XMarkIcon, DocumentTextIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import { useOrdersStore } from '@/stores/orders'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ close: [] }>()

const ordersStore = useOrdersStore()
const loading = ref(true)
const text = ref('')

function print() {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<html><body><pre style="font-family:monospace;font-size:12px;white-space:pre-wrap">${text.value}</pre></body></html>`)
  w.document.close()
  w.focus()
  w.print()
  w.close()
}

function download() {
  const blob = new Blob([text.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `packing-slip-${props.orderId}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await ordersStore.fetchPackingSlip(props.orderId)
  text.value = ordersStore.packingSlipText
  loading.value = false
})
</script>
