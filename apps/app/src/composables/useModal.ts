import { ref, shallowRef } from 'vue'
import type { Component } from 'vue'

interface ModalState {
  visible: boolean
  component: Component | null
  props: Record<string, unknown>
}

const state = ref<ModalState>({
  visible: false,
  component: null,
  props: {}
})

export function useModal() {
  function openModal(component: Component, props: Record<string, unknown> = {}) {
    state.value.component = shallowRef(component) as unknown as Component
    state.value.props = props
    state.value.visible = true
  }

  function closeModal() {
    state.value.visible = false
    setTimeout(() => {
      state.value.component = null
      state.value.props = {}
    }, 300)
  }

  return { state, openModal, closeModal }
}
