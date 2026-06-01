import { computed, reactive } from 'vue'

type NetworkToken = symbol

const state = reactive({
  active: 0,
  visible: false,
  label: 'Syncing with QeSuite',
})

let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let visibleSince = 0

const SHOW_DELAY_MS = 120
const MIN_VISIBLE_MS = 420

export function beginNetworkActivity(label = 'Syncing with QeSuite'): NetworkToken {
  const token = Symbol('network-activity')
  state.active += 1
  state.label = label

  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  if (!state.visible && !showTimer) {
    showTimer = setTimeout(() => {
      state.visible = true
      visibleSince = Date.now()
      showTimer = null
    }, SHOW_DELAY_MS)
  }

  return token
}

export function endNetworkActivity(_token?: NetworkToken) {
  state.active = Math.max(0, state.active - 1)
  if (state.active > 0) return

  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }

  const elapsed = Date.now() - visibleSince
  const delay = state.visible ? Math.max(0, MIN_VISIBLE_MS - elapsed) : 0

  hideTimer = setTimeout(() => {
    if (state.active === 0) state.visible = false
    hideTimer = null
  }, delay)
}

export function useNetworkActivity() {
  return {
    activeCount: computed(() => state.active),
    isActive: computed(() => state.visible),
    label: computed(() => state.label),
  }
}
