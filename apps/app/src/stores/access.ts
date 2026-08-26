import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CurrentAccess, StaffInvitation, StoreMember } from '@qesuite/types'
import {
  apiCreateInvitation,
  apiGetAccessCatalog,
  apiGetCurrentAccess,
  apiGetInvitations,
  apiGetMembers,
  apiRenewInvitation,
  apiRevokeInvitation,
  apiSetMemberStatus,
  apiUpdateMember,
  type PermissionCatalog,
  type StaffAccessInput,
} from '@/api/access'

export const useAccessStore = defineStore('access', () => {
  const current = ref<CurrentAccess | null>(null)
  const catalog = ref<PermissionCatalog | null>(null)
  const members = ref<StoreMember[]>([])
  const invitations = ref<StaffInvitation[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const permissionSet = computed(() => new Set(current.value?.permissions ?? []))

  function can(permission: string): boolean {
    return Boolean(current.value?.is_owner || permissionSet.value.has(permission))
  }

  function canAny(...permissions: string[]): boolean {
    return Boolean(current.value?.is_owner || permissions.some(permission => permissionSet.value.has(permission)))
  }

  async function fetchCurrent(force = false) {
    if (loaded.value && !force) return current.value
    const response = await apiGetCurrentAccess()
    if (!response.success || !response.data) throw new Error(response.error || 'Failed to load access')
    current.value = response.data
    loaded.value = true
    return current.value
  }

  async function fetchManagement() {
    loading.value = true
    try {
      const [catalogResponse, membersResponse, invitationsResponse] = await Promise.all([
        apiGetAccessCatalog(), apiGetMembers(), apiGetInvitations(),
      ])
      if (!catalogResponse.success || !catalogResponse.data) throw new Error(catalogResponse.error || 'Failed to load permission catalog')
      if (!membersResponse.success || !membersResponse.data) throw new Error(membersResponse.error || 'Failed to load staff')
      if (!invitationsResponse.success || !invitationsResponse.data) throw new Error(invitationsResponse.error || 'Failed to load invitations')
      catalog.value = catalogResponse.data
      members.value = membersResponse.data
      invitations.value = invitationsResponse.data
    } finally {
      loading.value = false
    }
  }

  async function createInvitation(input: StaffAccessInput) {
    const response = await apiCreateInvitation(input)
    if (!response.success || !response.data) throw new Error(response.error || 'Failed to invite staff member')
    await fetchManagement()
    return response.data
  }

  async function updateMember(id: string, input: StaffAccessInput) {
    const response = await apiUpdateMember(id, input)
    if (!response.success) throw new Error(response.error || 'Failed to update access')
    await fetchManagement()
  }

  async function setMemberStatus(id: string, isActive: boolean) {
    const response = await apiSetMemberStatus(id, isActive)
    if (!response.success) throw new Error(response.error || 'Failed to update staff status')
    await fetchManagement()
  }

  async function renewInvitation(id: string) {
    const response = await apiRenewInvitation(id)
    if (!response.success || !response.data) throw new Error(response.error || 'Failed to renew invitation')
    await fetchManagement()
    return response.data
  }

  async function revokeInvitation(id: string) {
    const response = await apiRevokeInvitation(id)
    if (!response.success) throw new Error(response.error || 'Failed to revoke invitation')
    await fetchManagement()
  }

  function reset() {
    current.value = null
    catalog.value = null
    members.value = []
    invitations.value = []
    loaded.value = false
  }

  return {
    current, catalog, members, invitations, loading, loaded,
    can, canAny, fetchCurrent, fetchManagement, createInvitation,
    updateMember, setMemberStatus, renewInvitation, revokeInvitation, reset,
  }
})
