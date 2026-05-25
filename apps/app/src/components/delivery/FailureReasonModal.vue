<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 flex items-end" @click.self="$emit('cancel')">
    <div class="absolute inset-0 bg-black/50" @click="$emit('cancel')"></div>

    <!-- Bottom sheet -->
    <div class="relative w-full bg-white rounded-t-3xl p-6 animate-slide-up safe-bottom">
      <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5"></div>

      <h2 class="text-2xl font-black text-gray-900 mb-1">Couldn't deliver?</h2>
      <p class="text-gray-500 mb-5">Why couldn't you deliver?</p>

      <!-- Preset reasons -->
      <div class="space-y-3 mb-4">
        <button
          v-for="option in reasons"
          :key="option"
          class="w-full py-4 px-5 text-left text-base font-semibold rounded-2xl transition-colors tap-target"
          :class="selected === option
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-800 active:bg-gray-200'"
          @click="selectReason(option)"
        >
          {{ option }}
        </button>
      </div>

      <!-- Custom reason -->
      <div v-if="selected === 'Other'" class="mb-5">
        <textarea
          v-model="customReason"
          placeholder="Type reason here..."
          rows="3"
          class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-red-400 focus:outline-none text-base resize-none"
        ></textarea>
      </div>

      <!-- Confirm button -->
      <button
        class="btn-action-red"
        :disabled="!canConfirm"
        @click="handleConfirm"
      >
        Confirm
      </button>

      <button
        class="w-full mt-3 py-4 text-gray-500 font-semibold text-base tap-target"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  confirm: [reason: string]
  cancel: []
}>()

const reasons = ['Wrong address', 'Customer unreachable', 'Other']
const selected = ref('')
const customReason = ref('')

const canConfirm = computed(() => {
  if (!selected.value) return false
  if (selected.value === 'Other') return customReason.value.trim().length > 0
  return true
})

function selectReason(r: string) {
  selected.value = r
  if (r !== 'Other') customReason.value = ''
}

function handleConfirm() {
  if (!canConfirm.value) return
  const reason = selected.value === 'Other' ? customReason.value.trim() : selected.value
  emit('confirm', reason)
}
</script>
