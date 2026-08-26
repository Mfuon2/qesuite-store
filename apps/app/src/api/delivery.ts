import { apiFetch } from './index'
import type { ApiResponse, DeliveryStaff, DeliveryStaffCreate, DeliveryStaffUpdate, DeliveryAssignment } from '@qesuite/types'

// ─── Rider (magic link) ───────────────────────────────────────────────────────

export interface VerifyResponse {
  access_token: string
  user: { id: string; name: string; tenant_id: string }
}

// The same phone can be an active rider at more than one store — the backend
// returns this instead of VerifyResponse when the magic link matched multiple
// tenants, mirroring the owner multi-store selection flow.
export interface RiderStoreSelectionData {
  requires_store_selection: true
  verify_token: string
  stores: { tenant_id: string; name: string; slug: string; logo_url: string | null; primary_color: string }[]
}

export interface AssignedOrder {
  assignment_id: string
  assignment_status: string
  assigned_at: string
  picked_up_at: string | null
  order_id: string
  tracking_code: string
  customer_name: string | null
  customer_phone: string
  delivery_address: string | null
  delivery_lat: number | null
  delivery_lng: number | null
  total: number
  notes: string | null
  order_status: string
}

export async function requestMagicLinkApi(phone: string): Promise<void> {
  const res = await apiFetch<ApiResponse<null>>('/api/auth/rider/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
  if (!res.success) throw new Error(res.error ?? 'Failed to send magic link')
}

export async function verifyMagicLinkApi(token: string): Promise<VerifyResponse | RiderStoreSelectionData> {
  const res = await apiFetch<ApiResponse<VerifyResponse | RiderStoreSelectionData>>(
    '/api/auth/rider/verify',
    { method: 'POST', body: JSON.stringify({ token }) }
  )
  if (!res.success || !res.data) throw new Error(res.error || 'Verification failed')
  return res.data
}

export async function selectRiderStoreApi(verifyToken: string, tenantId: string): Promise<VerifyResponse> {
  const res = await apiFetch<ApiResponse<VerifyResponse>>(
    '/api/auth/rider/select-store',
    { method: 'POST', body: JSON.stringify({ token: verifyToken, tenant_id: tenantId }) }
  )
  if (!res.success || !res.data) throw new Error(res.error || 'Store selection failed')
  return res.data
}

export async function getMyOrders(): Promise<AssignedOrder[]> {
  const res = await apiFetch<ApiResponse<AssignedOrder[]>>('/api/delivery/orders')
  if (!res.success || !res.data) return []
  return res.data
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: string,
  failureReason?: string
): Promise<void> {
  await apiFetch<ApiResponse<null>>('/api/delivery/status', {
    method: 'PUT',
    body: JSON.stringify({ assignment_id: assignmentId, status, failure_reason: failureReason }),
  })
}

export async function pingLocation(lat: number, lng: number): Promise<void> {
  await apiFetch<ApiResponse<null>>('/api/delivery/location', {
    method: 'PUT',
    body: JSON.stringify({ lat, lng }),
  })
}

// ─── Owner (delivery staff management) ───────────────────────────────────────

export async function apiGetDeliveryStaff(): Promise<ApiResponse<DeliveryStaff[]>> {
  return apiFetch('/api/delivery/staff')
}

export async function apiCreateDeliveryStaff(payload: DeliveryStaffCreate): Promise<ApiResponse<DeliveryStaff>> {
  return apiFetch('/api/delivery/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiUpdateDeliveryStaff(id: string, payload: DeliveryStaffUpdate): Promise<ApiResponse<DeliveryStaff>> {
  return apiFetch(`/api/delivery/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function apiDeleteDeliveryStaff(id: string): Promise<ApiResponse<null>> {
  return apiFetch(`/api/delivery/staff/${id}`, { method: 'DELETE' })
}

export async function apiGetActiveAssignments(): Promise<ApiResponse<DeliveryAssignment[]>> {
  return apiFetch('/api/delivery/assignments?status=active')
}

export async function apiSendMagicLink(staffId: string): Promise<ApiResponse<null>> {
  return apiFetch(`/api/delivery/staff/${staffId}/magic-link`, { method: 'POST' })
}
