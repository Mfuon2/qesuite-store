<template>
  <div class="space-y-3">
    <div class="admin-card p-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Store modules</p>
      <p class="text-sm text-slate-500 mb-4">
        Turn a module off to hide it from this store's owner dashboard. Staff permission grants still apply on top of this —
        a module switched off here is hidden for everyone at the store, regardless of their own access.
      </p>

      <div class="space-y-2">
        <div
          v-for="module in STORE_MODULES"
          :key="module.key"
          class="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 p-3.5"
        >
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-950">{{ module.label }}</p>
            <p class="mt-0.5 text-xs leading-5 text-slate-500">{{ module.description }}</p>
          </div>
          <button
            type="button"
            class="qs-toggle shrink-0"
            :class="isEnabled(module.key) ? 'bg-primary' : 'bg-slate-200'"
            :disabled="saving"
            @click="toggle(module.key)"
          >
            <span class="qs-toggle-thumb" :class="isEnabled(module.key) ? 'translate-x-5' : 'translate-x-0.5'" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { STORE_MODULES } from '@qesuite/shared'
import { useStoresStore } from '@/stores/stores'
import { useAdminAction } from '@/composables/useAdminAction'
import { updateStoreModules } from '@/api/admin'

const props = defineProps<{ storeId: string; disabledModules: string[] }>()

const stores = useStoresStore()
const { loading: saving, run } = useAdminAction()

// Optimistic local copy so every toggle click feels instant; reconciled with
// the server response (or rolled back on failure) once the request settles.
const pending = ref<string[]>([...props.disabledModules])

function isEnabled(key: string) {
  return !pending.value.includes(key)
}

async function toggle(key: string) {
  const next = pending.value.includes(key)
    ? pending.value.filter(k => k !== key)
    : [...pending.value, key]
  const previous = pending.value
  pending.value = next

  const ok = await run(
    async () => {
      const saved = await updateStoreModules(props.storeId, next)
      pending.value = saved
      await stores.fetchStore(props.storeId)
    },
    'Modules updated.',
    'Failed to update modules.'
  )
  if (!ok) pending.value = previous
}
</script>
