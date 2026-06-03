<template>
  <div class="flex items-center gap-1.5">
    <div :class="['w-2 h-2 rounded-full', dotClass]">
      <div v-if="status === 'connected'" :class="['absolute w-2 h-2 rounded-full opacity-75 animate-ping', pingClass]" />
    </div>
    <span :class="['text-xs font-medium', textClass]">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'connected' | 'reconnecting' | 'disconnected'
}>()

const dotClass = computed(() => ({
  connected: 'bg-emerald-500 relative',
  reconnecting: 'bg-yellow-400 animate-pulse relative',
  disconnected: 'bg-red-400 relative'
}[props.status]))

const pingClass = computed(() => ({
  connected: 'bg-emerald-400',
  reconnecting: 'bg-yellow-300',
  disconnected: 'bg-red-300'
}[props.status]))

const textClass = computed(() => ({
  connected: 'text-emerald-600 ',
  reconnecting: 'text-yellow-600 ',
  disconnected: 'text-red-500 '
}[props.status]))

const label = computed(() => ({
  connected: 'Live',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected'
}[props.status]))
</script>
