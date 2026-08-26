<template>
  <div>
    <div
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
      :class="[
        'relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all',
        compact ? 'min-h-[88px]' : 'min-h-[120px]',
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-200  hover:border-primary/50 bg-gray-50 ',
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        class="hidden"
        :disabled="disabled"
        @change="handleChange"
      />

      <!-- Preview -->
      <template v-if="preview">
        <img :src="preview" class="w-full h-full object-cover rounded-xl absolute inset-0" />
        <div class="relative z-10 bg-black/50 rounded-xl inset-0 absolute flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span class="text-white text-sm font-medium">Change image</span>
        </div>
      </template>

      <!-- Upload prompt -->
      <template v-else>
        <div :class="compact ? 'p-2 text-center' : 'p-4 text-center'">
          <PhotoIcon :class="compact ? 'mx-auto mb-1 h-7 w-7 text-gray-300' : 'mx-auto mb-2 h-10 w-10 text-gray-300'" />
          <p :class="compact ? 'text-xs font-medium text-gray-600' : 'text-sm font-medium text-gray-600'">
            {{ isDragging ? 'Drop to upload' : 'Click or drag & drop' }}
          </p>
          <p :class="compact ? 'mt-0.5 text-[10px] text-gray-400' : 'mt-1 text-xs text-gray-400'">JPEG, PNG, WebP — max 10MB</p>
        </div>
      </template>
    </div>

    <!-- Progress -->
    <div v-if="progress > 0 && progress < 100" class="mt-2">
      <div class="h-1.5 bg-gray-100  rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <p class="text-xs text-gray-400 mt-1 text-right">{{ progress }}%</p>
    </div>

    <!-- Error -->
    <p v-if="uploadError" class="text-red-500  text-xs mt-1">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhotoIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(defineProps<{
  modelValue?: string | null
  accept?: string
  maxSize?: number // bytes
  disabled?: boolean
  compact?: boolean
}>(), {
  accept: 'image/jpeg,image/png,image/webp',
  maxSize: 10 * 1024 * 1024,
  disabled: false,
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [url: string]
  'file-selected': [file: File]
  'upload-complete': [url: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const preview = ref<string | null>(props.modelValue || null)
const progress = ref(0)
const uploadError = ref('')

// Update preview when the parent async-loads a saved URL (e.g. on Settings mount)
watch(() => props.modelValue, (val) => {
  if (val && progress.value === 0) preview.value = val
})

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function handleChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function processFile(file: File) {
  uploadError.value = ''

  // Validate type
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    uploadError.value = 'Invalid file type. Use JPEG, PNG, or WebP.'
    return
  }

  // Validate size
  if (file.size > props.maxSize) {
    uploadError.value = `File too large. Max ${Math.round(props.maxSize / 1024 / 1024)}MB.`
    return
  }

  // Preview
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  emit('file-selected', file)
}

function setProgress(pct: number) {
  progress.value = pct
}

function setPreview(url: string) {
  preview.value = url
  progress.value = 100
  emit('update:modelValue', url)
  emit('upload-complete', url)
  setTimeout(() => { progress.value = 0 }, 1000)
}

function reset() {
  preview.value = null
  progress.value = 0
  uploadError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

defineExpose({ setProgress, setPreview, reset })
</script>
