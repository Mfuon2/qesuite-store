<template>
  <span
    class="admin-pill"
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
    return 'bg-red-50 text-red-700 ring-1 ring-red-100'
  }
  if (props.status === 'active') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  if (props.status === 'trialing') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  if (props.status === 'past_due') return 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
  if (props.status === 'cancelled') return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
})
</script>
