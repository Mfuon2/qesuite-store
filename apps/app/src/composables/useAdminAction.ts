import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

/**
 * Wraps an async admin action with:
 *   - loading ref  (disable buttons while in-flight)
 *   - success toast
 *   - error toast (extracts .message from thrown errors)
 *
 * Usage:
 *   const { loading, run } = useAdminAction()
 *   await run(
 *     () => stores.suspend(id, reason),
 *     'Store suspended.',
 *     'Failed to suspend store.'
 *   )
 */
export function useAdminAction() {
  const loading = ref(false)
  const toast = useToast()

  async function run(
    action: () => Promise<unknown>,
    successMsg: string,
    fallbackErrorMsg = 'An error occurred.'
  ): Promise<boolean> {
    loading.value = true
    try {
      await action()
      toast.success(successMsg)
      return true
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || fallbackErrorMsg
      toast.error(msg)
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
