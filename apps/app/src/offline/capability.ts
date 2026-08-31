import type { PosPaymentMethod } from '@qesuite/types'
import { isReachable } from './connectivity'

// A single, centralized guard — nothing else in the app should scatter its
// own navigator.onLine checks. Every POS operation's offline-eligibility is
// looked up here, once, rather than re-decided ad hoc in a component.
export type Capability = 'OFFLINE_ALLOWED' | 'ONLINE_REQUIRED' | 'ONLINE_PREFERRED'

const PAYMENT_METHOD_CAPABILITY: Record<PosPaymentMethod, Capability> = {
  cash: 'OFFLINE_ALLOWED',
  // A credit sale only needs the store's OWN books (customer credit limit),
  // never a third party — so it degrades gracefully offline rather than
  // being blocked, with the server reconciling an over-limit case via the
  // existing manager-approval queue once it syncs.
  credit: 'ONLINE_PREFERRED',
  // Both require a live round trip to an external party (Safaricom STK push,
  // a card processor) that cannot be faked or deferred — pretending either
  // succeeded offline would misrepresent a real payment.
  mpesa: 'ONLINE_REQUIRED',
  card: 'ONLINE_REQUIRED',
  split: 'ONLINE_REQUIRED',
}

export function capabilityForPaymentMethod(method: PosPaymentMethod): Capability {
  return PAYMENT_METHOD_CAPABILITY[method]
}

// Whether an operation with this capability may proceed RIGHT NOW, given
// actual (not navigator.onLine) reachability.
export function canProceed(capability: Capability): boolean {
  if (capability === 'ONLINE_REQUIRED') return isReachable.value
  return true
}

export function capabilityMessage(capability: Capability): string | null {
  if (capability !== 'ONLINE_REQUIRED' || isReachable.value) return null
  return 'This payment method needs a live connection and cannot be completed offline.'
}
