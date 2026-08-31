import { describe, test, expect, afterEach } from 'bun:test'
import { capabilityForPaymentMethod, canProceed, capabilityMessage } from '../capability'
import { reportReachable, reportUnreachable } from '../connectivity'

describe('capability guard', () => {
  afterEach(() => reportReachable())

  test('classifies each payment method correctly', () => {
    expect(capabilityForPaymentMethod('cash')).toBe('OFFLINE_ALLOWED')
    expect(capabilityForPaymentMethod('credit')).toBe('ONLINE_PREFERRED')
    expect(capabilityForPaymentMethod('mpesa')).toBe('ONLINE_REQUIRED')
    expect(capabilityForPaymentMethod('card')).toBe('ONLINE_REQUIRED')
    expect(capabilityForPaymentMethod('split')).toBe('ONLINE_REQUIRED')
  })

  test('OFFLINE_ALLOWED and ONLINE_PREFERRED always proceed, online or not', () => {
    reportUnreachable()
    expect(canProceed('OFFLINE_ALLOWED')).toBe(true)
    expect(canProceed('ONLINE_PREFERRED')).toBe(true)
    reportReachable()
    expect(canProceed('OFFLINE_ALLOWED')).toBe(true)
    expect(canProceed('ONLINE_PREFERRED')).toBe(true)
  })

  test('ONLINE_REQUIRED only proceeds when actually reachable', () => {
    reportReachable()
    expect(canProceed('ONLINE_REQUIRED')).toBe(true)
    expect(capabilityMessage('ONLINE_REQUIRED')).toBeNull()

    reportUnreachable()
    expect(canProceed('ONLINE_REQUIRED')).toBe(false)
    expect(capabilityMessage('ONLINE_REQUIRED')).not.toBeNull()
  })
})
