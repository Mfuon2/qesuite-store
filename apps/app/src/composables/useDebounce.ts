import { ref, type Ref } from 'vue'

/**
 * Returns a debounced wrapper around a callback.
 * Replaces the repetitive setTimeout/clearTimeout pattern in every view.
 *
 * Usage:
 *   const { debounce } = useDebounce(300)
 *   <input @input="debounce(() => fetchData())" />
 */
export function useDebounce(delay = 300) {
  const timer: Ref<ReturnType<typeof setTimeout> | null> = ref(null)

  function debounce(fn: () => void) {
    if (timer.value) clearTimeout(timer.value)
    timer.value = setTimeout(fn, delay)
  }

  function cancel() {
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }
  }

  return { debounce, cancel }
}
