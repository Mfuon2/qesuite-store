import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetApprovals, apiApproveRequest, apiRejectRequest } from '@/api/approvals'
import type { ApprovalRequest } from '@qesuite/types'
import { useToast } from '@/composables/useToast'

export const useApprovalsStore = defineStore('approvals', () => {
  const pending = ref<ApprovalRequest[]>([])
  const loading = ref(false)
  const deciding = ref<string | null>(null)
  const { showToast } = useToast()

  async function fetchPending() {
    loading.value = true
    try {
      const res = await apiGetApprovals('pending')
      if (res.success && res.data) pending.value = res.data
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load approvals', 'error')
    } finally { loading.value = false }
  }

  async function decide(id: string, verdict: 'approve' | 'reject', note?: string): Promise<boolean> {
    deciding.value = id
    try {
      const res = verdict === 'approve' ? await apiApproveRequest(id, note) : await apiRejectRequest(id, note)
      if (res.success) {
        showToast(verdict === 'approve' ? 'Request approved' : 'Request rejected', 'success')
        pending.value = pending.value.filter(p => p.id !== id)
        return true
      }
      return false
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to decide request', 'error')
      return false
    } finally { deciding.value = null }
  }

  return { pending, loading, deciding, fetchPending, decide }
})
