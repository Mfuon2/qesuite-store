<template>
  <Transition name="slide-up">
    <div
      v-if="visible"
      :class="['flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium', bannerClass]"
    >
      <div class="flex items-center gap-2">
        <ExclamationTriangleIcon class="w-4 h-4 shrink-0" />
        <span>
          <strong>{{ daysLeft }}</strong> {{ daysLeft === 1 ? 'day' : 'days' }} left in your trial.
        </span>
        <router-link to="/billing" class="underline hover:no-underline whitespace-nowrap">Upgrade now →</router-link>
      </div>
      <button @click="dismiss" class="opacity-70 hover:opacity-100 transition-opacity shrink-0">
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ daysLeft: number }>()

const visible = ref(false)

const bannerClass = computed(() => {
  if (props.daysLeft <= 3) return 'bg-red-500 text-white'
  if (props.daysLeft <= 7) return 'bg-yellow-400 text-yellow-900'
  return 'bg-emerald-500 text-white'
})

onMounted(() => {
  const dismissed = localStorage.getItem('trial_banner_dismissed')
  if (dismissed) {
    const dismissedAt = parseInt(dismissed)
    if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return
  }
  visible.value = true
})

function dismiss() {
  visible.value = false
  localStorage.setItem('trial_banner_dismissed', String(Date.now()))
}
</script>
