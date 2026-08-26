<template>
  <div class="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
    <div class="w-full max-w-sm text-center">
      <!-- Loading -->
      <template v-if="verifying">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-3xl mb-6 shadow-lg">
          <svg class="w-10 h-10 text-white spinning" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">Verifying...</h2>
        <p class="text-gray-500 mt-2">Please wait a moment</p>
      </template>

      <!-- Multiple stores share this phone -->
      <template v-else-if="storeChoices">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">Which store?</h2>
        <p class="text-gray-500 mb-6">You ride for {{ storeChoices.length }} stores. Pick one to continue.</p>
        <div class="space-y-2.5 text-left">
          <button
            v-for="store in storeChoices"
            :key="store.tenant_id"
            :disabled="!!selecting"
            class="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            @click="chooseStore(store.tenant_id)"
          >
            <div
              class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-lg font-black shadow-sm"
              :style="store.logo_url ? '' : `background-color: ${store.primary_color}20; color: ${store.primary_color}`"
            >
              <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="h-full w-full object-cover" />
              <span v-else>{{ store.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-900">{{ store.name }}</p>
            </div>
            <span v-if="selecting === store.tenant_id" class="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-emerald-500 animate-spin" />
          </button>
        </div>
        <p v-if="selectError" class="mt-4 text-sm text-red-500">{{ selectError }}</p>
      </template>

      <!-- Error -->
      <template v-else-if="verifyError">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-3xl mb-6">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Link expired</h2>
        <p class="text-gray-600 mb-6 leading-relaxed">
          Invalid or expired link.<br />Request a new one.
        </p>
        <RouterLink
          to="/login"
          class="btn-action-green inline-block text-center"
        >
          Request new link
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const verifying = ref(true)
const verifyError = ref(false)
const selecting = ref<string | null>(null)
const selectError = ref('')

const storeChoices = ref<{ tenant_id: string; name: string; logo_url: string | null; primary_color: string }[] | null>(null)

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (!token) {
    verifyError.value = true
    verifying.value = false
    return
  }

  try {
    const result = await auth.verifyRiderLink(token)
    if (!result.success) throw new Error()
    if ('requires_store_selection' in result && result.requires_store_selection) {
      storeChoices.value = auth.pendingRiderStoreSelection?.stores ?? []
      return
    }
    await router.replace({ name: 'rider-home' })
  } catch {
    verifyError.value = true
  } finally {
    verifying.value = false
  }
})

async function chooseStore(tenantId: string) {
  selectError.value = ''
  selecting.value = tenantId
  const res = await auth.selectRiderStore(tenantId)
  selecting.value = null
  if (res.success) {
    router.replace({ name: 'rider-home' })
  } else {
    selectError.value = res.error || 'Store selection failed'
  }
}
</script>
