<template>
  <div class="flex items-center gap-3">
    <div class="relative">
      <input
        type="color"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600 p-0.5 bg-white dark:bg-gray-800"
        :title="label"
      />
    </div>
    <input
      type="text"
      :value="modelValue"
      @input="handleHexInput"
      placeholder="#10b981"
      maxlength="7"
      class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
    />
    <div
      class="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm shrink-0"
      :style="{ backgroundColor: modelValue }"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleHexInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    emit('update:modelValue', val)
  }
}
</script>
