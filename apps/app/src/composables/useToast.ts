import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

const toasts = ref<Toast[]>([])

function removeToast(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  toasts.value.push({ id, message, type, duration })
  setTimeout(() => removeToast(id), duration)
}

export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    warning: (msg: string) => showToast(msg, 'warning'),
    info: (msg: string) => showToast(msg, 'info'),
    remove: removeToast,
  }
}
