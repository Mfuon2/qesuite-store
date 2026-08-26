<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" @click="!result && emit('cancel')"></div>
    <div class="admin-card relative w-full max-w-sm animate-fade-in p-4">

      <!-- Icon + title -->
      <div class="mb-3 flex items-center gap-2.5">
        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-950">Reset Password</h2>
          <p class="text-xs text-slate-500">{{ storeName }}</p>
        </div>
      </div>

      <!-- ── Step 1: choose mode ── -->
      <template v-if="!result">
        <p class="mb-3 text-xs leading-5 text-slate-600">
          Reset the store owner's login password. The new password will be shown once — copy and share it securely.
        </p>

        <!-- Mode toggle -->
        <div class="owner-segmented mb-3 grid w-full grid-cols-2">
          <button
            :class="['owner-segment-button', mode === 'auto' ? 'owner-segment-button-active' : '']"
            @click="mode = 'auto'"
          >
            Auto-generate
          </button>
          <button
            :class="['owner-segment-button', mode === 'custom' ? 'owner-segment-button-active' : '']"
            @click="mode = 'custom'"
          >
            Set manually
          </button>
        </div>

        <!-- Custom password input -->
        <div v-if="mode === 'custom'" class="mb-3">
          <label class="admin-label">New password</label>
          <div class="relative">
            <input
              v-model="customPassword"
              :type="showInput ? 'text' : 'password'"
              placeholder="Min. 8 characters"
              class="admin-input !pr-10"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              @click="showInput = !showInput"
            >
              <svg v-if="showInput" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <p v-if="customPassword && customPassword.length < 8" class="text-xs text-red-500 mt-1">
            Password must be at least 8 characters.
          </p>
        </div>

        <div class="mt-2 flex gap-2">
          <button class="admin-btn-secondary flex-1 justify-center" @click="emit('cancel')">
            Cancel
          </button>
          <button
            class="admin-btn-primary flex-1 justify-center"
            :disabled="isSubmitDisabled"
            @click="emit('confirm', mode === 'custom' ? customPassword : undefined)"
          >
            Reset Password
          </button>
        </div>
      </template>

      <!-- ── Step 2: show result ── -->
      <template v-else>
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <p class="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">New Password</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-base font-mono font-bold text-slate-950 break-all select-all">{{ result }}</code>
            <button
              class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              :class="copied ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-100'"
              title="Copy password"
              @click="copy"
            >
              <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>

        <p class="text-xs text-slate-500 mb-5">
          This password will not be shown again. Copy it and share it securely with the store owner.
        </p>

        <button class="admin-btn-primary w-full justify-center" @click="emit('done')">
          Done
        </button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  storeName: string
  result?: string
}>()

const emit = defineEmits<{
  confirm: [password: string | undefined]
  cancel: []
  done: []
}>()

const mode = ref<'auto' | 'custom'>('auto')
const customPassword = ref('')
const showInput = ref(false)
const copied = ref(false)

const isSubmitDisabled = computed(() => {
  if (mode.value === 'custom') {
    return !customPassword.value || customPassword.value.length < 8
  }
  return false
})

async function copy() {
  if (!props.result) return
  await navigator.clipboard.writeText(props.result).catch(() => {})
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
