import { ref } from 'vue'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function createPingSound(ctx: AudioContext) {
  // Create a pleasant two-tone ping
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc1.connect(gainNode)
  osc2.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc1.frequency.value = 880  // A5
  osc2.frequency.value = 1108.73 // C#6

  osc1.type = 'sine'
  osc2.type = 'sine'

  const now = ctx.currentTime
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 0.8)
  osc2.stop(now + 0.8)
}

const soundEnabled = ref(localStorage.getItem('sound_enabled') !== 'false')

export function useOrderSound() {
  function playPing() {
    if (!soundEnabled.value) return
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => createPingSound(ctx))
      } else {
        createPingSound(ctx)
      }
    } catch {
      // Web Audio not supported
    }
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('sound_enabled', String(soundEnabled.value))
  }

  return { soundEnabled, playPing, toggleSound }
}
