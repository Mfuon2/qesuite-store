import { ref } from 'vue'
import { apiFetchBlob } from '@/api/index'
import { useToast } from '@/composables/useToast'

/** Fetches an authenticated PDF endpoint and opens it in a new tab for viewing/printing. */
export function useDocumentPdf() {
  const opening = ref(false)
  const { showToast } = useToast()

  async function openPdf(path: string) {
    opening.value = true
    try {
      const blob = await apiFetchBlob(path)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // Revoke once the new tab has had time to load it — freeing memory
      // immediately would race the browser's fetch of the blob: URL.
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to open document', 'error')
    } finally {
      opening.value = false
    }
  }

  return { opening, openPdf }
}
