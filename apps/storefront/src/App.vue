<template>
  <div :class="isDark ? 'dark' : ''" class="min-h-screen bg-white  transition-colors duration-200">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { usePreferredDark, useStorage } from '@vueuse/core'
import ToastContainer from '@/components/ToastContainer.vue'

const prefersDark = usePreferredDark()
const storedTheme = useStorage<'light' | 'dark' | 'system'>('theme', 'system')

const isDark = computed(() => {
  if (storedTheme.value === 'system') return prefersDark.value
  return storedTheme.value === 'dark'
})

onMounted(() => {
  // Expose theme toggle globally for header
  ;(window as any).__toggleDark = () => {
    if (storedTheme.value === 'dark') storedTheme.value = 'light'
    else storedTheme.value = 'dark'
  }
  ;(window as any).__isDark = isDark
})
</script>
