<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SubscriptionStatus } from '@qesuite/types'

const props = defineProps<{
  status: SubscriptionStatus
  suspended?: boolean
}>()

const label = computed(() => {
  if (props.suspended) return 'Suspended'
  const map: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trialing',
    past_due: 'Past Due',
    cancelled: 'Cancelled',
    suspended: 'Suspended',
  }
  return map[props.status] ?? props.status
})

const badgeClass = computed(() => {
  if (props.suspended || props.status === 'suspended') {
    return 'bg-red-500/20 text-red-400'
  }
  if (props.status === 'active') return 'bg-emerald-500/20 text-emerald-400'
  if (props.status === 'trialing') return 'bg-amber-500/20 text-amber-400'
  if (props.status === 'past_due') return 'bg-orange-500/20 text-orange-400'
  if (props.status === 'cancelled') return 'bg-slate-500/20 text-slate-400'
  return 'bg-slate-700 text-slate-400'
})
</script>
