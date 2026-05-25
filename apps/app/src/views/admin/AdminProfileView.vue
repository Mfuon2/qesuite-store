<template>
  <div class="p-4 max-w-4xl space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-lg font-bold text-white">My Profile</h1>
      <p class="text-slate-400 text-xs mt-0.5">Update your name, contact info and password</p>
    </div>

    <!-- Avatar + role badge — full width -->
    <div class="admin-card p-5 flex items-center gap-4">
      <div class="w-14 h-14 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0 ring-2 ring-indigo-500/40">
        <span class="text-indigo-300 font-bold text-2xl">{{ initial }}</span>
      </div>
      <div>
        <p class="text-white font-semibold">{{ form.name || authStore.user?.name }}</p>
        <p class="text-slate-400 text-xs mt-0.5">{{ authStore.user?.email }}</p>
        <span class="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-semibold capitalize">
          {{ authStore.user?.role }}
        </span>
      </div>
    </div>

    <!-- Two-column grid: Personal Details | Change Password -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

      <!-- Profile form -->
      <div class="admin-card p-5 space-y-4">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal Details</h2>

        <div>
          <label for="profile-name" class="admin-label">Name</label>
          <input
            id="profile-name"
            v-model="form.name"
            type="text"
            class="admin-input"
            placeholder="Your display name"
          />
        </div>

        <div>
          <label for="profile-email" class="admin-label">Email</label>
          <input
            id="profile-email"
            v-model="form.email"
            type="email"
            class="admin-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="profile-phone" class="admin-label">Phone</label>
          <input
            id="profile-phone"
            v-model="form.phone"
            type="tel"
            class="admin-input"
            placeholder="+254 7XX XXX XXX"
          />
        </div>

        <button
          id="btn-save-profile"
          class="admin-btn-primary w-full justify-center"
          :disabled="profileAction.loading.value"
          @click="saveProfile"
        >
          <span v-if="profileAction.loading.value" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span v-else>Save Profile</span>
        </button>
      </div>

      <!-- Password change -->
      <div class="admin-card p-5 space-y-4">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Change Password</h2>

        <div>
          <label for="profile-current-pw" class="admin-label">Current Password</label>
          <input
            id="profile-current-pw"
            v-model="passwordForm.current_password"
            type="password"
            class="admin-input"
            placeholder="Enter current password"
            autocomplete="current-password"
          />
        </div>

        <div>
          <label for="profile-new-pw" class="admin-label">New Password</label>
          <input
            id="profile-new-pw"
            v-model="passwordForm.new_password"
            type="password"
            class="admin-input"
            placeholder="Min. 8 characters"
            autocomplete="new-password"
          />
        </div>

        <div>
          <label for="profile-confirm-pw" class="admin-label">Confirm New Password</label>
          <input
            id="profile-confirm-pw"
            v-model="passwordForm.confirm_password"
            type="password"
            class="admin-input"
            placeholder="Repeat new password"
            autocomplete="new-password"
          />
        </div>

        <p v-if="pwMismatch" class="text-red-400 text-xs">Passwords do not match.</p>

        <button
          id="btn-change-password"
          class="admin-btn-secondary w-full justify-center"
          :disabled="passwordAction.loading.value || pwMismatch"
          @click="changePassword"
        >
          <span v-if="passwordAction.loading.value" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span v-else>Change Password</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiGetMe, apiUpdateMe } from '@/api/auth'
import { useAdminAction } from '@/composables/useAdminAction'

const authStore = useAuthStore()

// ── Profile form ────────────────────────────────────────────────
const form = ref({
  name: '',
  email: '',
  phone: '',
})

// ── Password form ────────────────────────────────────────────────
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const pwMismatch = computed(() =>
  passwordForm.value.new_password.length > 0 &&
  passwordForm.value.new_password !== passwordForm.value.confirm_password
)

const initial = computed(() =>
  (form.value.name || authStore.user?.name || '?')[0].toUpperCase()
)

// ── Actions (use composable — no manual loading/toast boilerplate) ──
const profileAction = useAdminAction()
const passwordAction = useAdminAction()

async function saveProfile() {
  await profileAction.run(
    async () => {
      const res = await apiUpdateMe({
        name: form.value.name || undefined,
        email: form.value.email || undefined,
        phone: form.value.phone || undefined,
      })
      if (!res.success) throw new Error(res.error || 'Update failed')
      // Reflect the name change in the sidebar without a full reload
      if (authStore.user && form.value.name) {
        authStore.user.name = form.value.name
      }
    },
    'Profile updated.',
    'Failed to update profile.'
  )
}

async function changePassword() {
  if (pwMismatch.value) return
  const ok = await passwordAction.run(
    async () => {
      const res = await apiUpdateMe({
        current_password: passwordForm.value.current_password,
        new_password: passwordForm.value.new_password,
      })
      if (!res.success) throw new Error(res.error || 'Password update failed')
    },
    'Password changed successfully.',
    'Failed to change password.'
  )
  if (ok) {
    passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
  }
}

onMounted(async () => {
  try {
    const res = await apiGetMe()
    if (res.success && res.data) {
      form.value.name = res.data.name || ''
      form.value.email = res.data.email || ''
      form.value.phone = res.data.phone || ''
    }
  } catch {
    // If fetch fails fall back to JWT-cached user
    form.value.name = authStore.user?.name || ''
    form.value.email = authStore.user?.email || ''
    form.value.phone = authStore.user?.phone || ''
  }
})
</script>
