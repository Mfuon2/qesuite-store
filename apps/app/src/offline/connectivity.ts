import { ref } from 'vue'

// navigator.onLine is only ever a hint — it can be wrong in both directions
// (reports online behind a captive portal with no real route out; reports
// offline on some platforms when the network is actually fine). The only
// thing that actually proves reachability is a real request's outcome,
// reported here by the sync engine after every push/pull attempt. UI code
// should read `isReachable`, never call navigator.onLine directly.
// Guarded for a non-browser context (e.g. this module's unit tests run
// under Bun, not a DOM) — falls back to "assume reachable" rather than
// throwing on import.
export const isReachable = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

export function reportReachable(): void {
  isReachable.value = true
}

export function reportUnreachable(): void {
  isReachable.value = false
}

// The browser event is still useful as a fast, cheap negative signal (a
// device going literally offline is unambiguous) — but a positive "online"
// event only means "try again," not "confirmed reachable," so it doesn't
// set isReachable itself; the next successful sync call does that.
if (typeof window !== 'undefined') {
  window.addEventListener('offline', reportUnreachable)
}
