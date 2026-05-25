import { reactive } from 'vue'

interface ConfirmState {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  resolve: (value: boolean) => void
}

const state = reactive<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  resolve: () => {}
})

export function useConfirm() {
  function confirm(options: {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }): Promise<boolean> {
    return new Promise((resolve) => {
      state.visible = true
      state.title = options.title
      state.message = options.message
      state.confirmLabel = options.confirmLabel || 'Confirm'
      state.cancelLabel = options.cancelLabel || 'Cancel'
      state.danger = options.danger || false
      state.resolve = (value: boolean) => {
        state.visible = false
        resolve(value)
      }
    })
  }

  return { state, confirm }
}
