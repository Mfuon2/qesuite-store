<template>
  <div v-if="enabled" :class="['ad-unit', `ad-unit--${format}`]">
    <p class="ad-label">Advertisement</p>
    <ins
      class="adsbygoogle"
      :style="adStyle"
      :data-ad-client="publisherId"
      :data-ad-slot="slot"
      :data-ad-format="format"
      data-full-width-responsive="true"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'

const props = withDefaults(defineProps<{
  slot: string              // AdSense ad slot ID — get from your AdSense dashboard
  format?: 'auto' | 'fluid' | 'rectangle' | 'leaderboard'
  publisherId?: string
}>(), {
  format: 'auto',
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXX', // replace with your Publisher ID
})

// Don't show ads in dev mode
const enabled = computed(() => import.meta.env.PROD)

const adStyle = computed(() => ({
  display: 'block',
  ...(props.format === 'rectangle' ? { width: '300px', height: '250px' } : {}),
  ...(props.format === 'leaderboard' ? { width: '728px', height: '90px' } : {}),
}))

onMounted(() => {
  if (!enabled.value) return
  try {
    // Push to AdSense queue — works in Vue SPA after route changes too
    (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []
    ;(window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({})
  } catch { /* AdSense not loaded yet */ }
})
</script>

<style scoped>
.ad-unit { width: 100%; overflow: hidden; }
.ad-label {
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 2px;
  letter-spacing: 0.05em;
}
.ad-unit--rectangle { max-width: 300px; margin: 0 auto; }
</style>
