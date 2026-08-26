<template>
  <div class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
    <section class="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div class="mb-5 flex items-center gap-3">
        <div class="qs-brand-mark h-10 w-10 shrink-0" />
        <div>
          <p class="qs-brand-word text-lg"><span>Store</span></p>
          <p class="text-xs text-slate-500">Staff invitation</p>
        </div>
      </div>

      <div v-if="loading" class="py-12 text-center text-sm text-slate-500">Loading invitation…</div>
      <div v-else-if="error && !invitation" class="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
        {{ error }}
        <RouterLink to="/login" class="mt-4 block font-bold text-primary">Return to sign in</RouterLink>
      </div>
      <div v-else-if="accepted" class="rounded-2xl bg-emerald-50 p-5 text-center">
        <CheckCircleIcon class="mx-auto h-10 w-10 text-emerald-600" />
        <h1 class="mt-3 text-lg font-bold text-slate-950">Your account is ready</h1>
        <p class="mt-1 text-sm text-slate-600">Sign in with {{ invitation?.email }} to access {{ invitation?.store_name }}.</p>
        <RouterLink to="/login" class="owner-primary-action mt-5 w-full justify-center">Sign in</RouterLink>
      </div>
      <form v-else-if="invitation" class="space-y-4" @submit.prevent="accept">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary">{{ invitation.store_name }}</p>
          <h1 class="mt-1 text-xl font-black text-slate-950">Welcome, {{ invitation.name }}</h1>
          <p class="mt-1 text-sm text-slate-500">Create a password for your staff account.</p>
        </div>
        <div class="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
          <div><p class="text-slate-400">Email</p><p class="mt-0.5 truncate font-bold text-slate-700">{{ invitation.email }}</p></div>
          <div><p class="text-slate-400">Role</p><p class="mt-0.5 truncate font-bold text-slate-700">{{ invitation.job_title || 'Staff member' }}</p></div>
        </div>
        <label class="block">
          <span class="admin-label">Password</span>
          <input v-model="password" class="owner-input mt-2" type="password" minlength="8" maxlength="128" autocomplete="new-password" required />
        </label>
        <label class="block">
          <span class="admin-label">Confirm password</span>
          <input v-model="confirmPassword" class="owner-input mt-2" type="password" minlength="8" maxlength="128" autocomplete="new-password" required />
        </label>
        <p v-if="error" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{{ error }}</p>
        <button class="owner-primary-action w-full justify-center" type="submit" :disabled="submitting">
          {{ submitting ? 'Creating account…' : 'Accept invitation' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { apiAcceptInvitation, apiGetInvitation, type InvitationPreview } from '@/api/access'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const invitation = ref<InvitationPreview | null>(null)
const password = ref('')
const confirmPassword = ref('')
const loading = ref(true)
const submitting = ref(false)
const accepted = ref(false)
const error = ref('')

async function accept() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  submitting.value = true
  try {
    const response = await apiAcceptInvitation(token, password.value)
    if (!response.success) throw new Error(response.error || 'Failed to accept invitation')
    accepted.value = true
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Failed to accept invitation'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!token) {
    error.value = 'This invitation link is incomplete'
    loading.value = false
    return
  }
  try {
    const response = await apiGetInvitation(token)
    if (!response.success || !response.data) throw new Error(response.error || 'Invitation not found')
    if (response.data.status !== 'pending') throw new Error(response.data.status === 'expired' ? 'This invitation has expired' : 'This invitation is no longer available')
    invitation.value = response.data
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Invitation not found'
  } finally {
    loading.value = false
  }
})
</script>
