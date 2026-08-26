<template>
  <div class="admin-page-narrow space-y-5">
    <!-- Header -->
    <section class="admin-page-hero">
      <div class="admin-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">My Profile</h1>
          <p class="owner-subtitle">Update your admin identity, contact details, and password.</p>
        </div>
      </div>
    </section>

    <!-- Avatar + role badge — full width -->
    <div class="admin-card p-5 flex items-center gap-4">
      <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-emerald-50 ring-1 ring-emerald-100">
        <span class="text-emerald-700 font-bold text-2xl">{{ initial }}</span>
      </div>
      <div>
        <p class="text-slate-950 font-semibold">{{ form.name || authStore.user?.name }}</p>
        <p class="text-slate-500 text-xs mt-0.5">{{ authStore.user?.email }}</p>
        <span class="admin-pill mt-1.5 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 capitalize">
          {{ authStore.user?.role }}
        </span>
      </div>
    </div>

    <!-- Two-column grid: Personal Details | Change Password -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

      <!-- Profile form -->
      <div class="admin-card p-5 space-y-4">
        <div>
          <h2 class="admin-section-title">Personal Details</h2>
          <p class="admin-section-copy">Keep your platform profile accurate.</p>
        </div>

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
        <div>
          <h2 class="admin-section-title">Change Password</h2>
          <p class="admin-section-copy">Use a strong password for console access.</p>
        </div>

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

        <p v-if="pwMismatch" class="text-red-700 text-xs">Passwords do not match.</p>

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
