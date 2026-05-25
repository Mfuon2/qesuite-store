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

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (!token) {
    verifyError.value = true
    verifying.value = false
    return
  }

  try {
    await auth.verifyRiderLink(token)
    await router.replace({ name: 'rider-home' })
  } catch {
    verifyError.value = true
  } finally {
    verifying.value = false
  }
})
</script>
