import { offlineDb } from './db'
import { uuid7 } from './uuid7'
import api from '@/api/index'
import type { ApiResponse } from '@qesuite/types'

interface DeviceSessionResponse {
  credential: string
  expires_at: string
}

const AES_ALGO = { name: 'AES-GCM', length: 256 }

async function encryptCredential(key: CryptoKey, credential: string): Promise<{ iv: ArrayBuffer; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(credential))
  return { iv: iv.buffer, ciphertext }
}

async function decryptCredential(key: CryptoKey, iv: ArrayBuffer, ciphertext: ArrayBuffer): Promise<string> {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

async function storeSession(deviceId: string, cryptoKey: CryptoKey, session: DeviceSessionResponse) {
  const { iv, ciphertext } = await encryptCredential(cryptoKey, session.credential)
  await offlineDb.deviceMeta.put({
    id: 'device',
    deviceId,
    cryptoKey,
    encryptedCredential: ciphertext,
    credentialIv: iv,
    credentialExpiresAt: session.expires_at,
  })
}

// Called after a normal (online) login. Registers this installation's device
// identity on first use, or renews its credential if it's missing/close to
// expiry. Never throws — a failure here must not block or disrupt login;
// the next successful online moment (or the next login) retries.
export async function ensureDeviceRegistered(): Promise<void> {
  try {
    const existing = await offlineDb.deviceMeta.get('device')

    if (!existing) {
      const deviceId = uuid7()
      const cryptoKey = await crypto.subtle.generateKey(AES_ALGO, false, ['encrypt', 'decrypt'])
      const res = await api.post<ApiResponse<DeviceSessionResponse>>('/api/pos-devices/register', {
        device_id: deviceId,
        name: `${navigator.platform || 'Web'} POS terminal`,
      })
      if (res.success && res.data) await storeSession(deviceId, cryptoKey, res.data)
      return
    }

    const expiresAt = existing.credentialExpiresAt ? new Date(existing.credentialExpiresAt).getTime() : 0
    const renewalWindowMs = 12 * 60 * 60 * 1000 // renew once within 12h of expiry
    if (Date.now() < expiresAt - renewalWindowMs) return // still comfortably valid

    const res = await api.post<ApiResponse<DeviceSessionResponse>>(`/api/pos-devices/${existing.deviceId}/session`, {})
    if (res.success && res.data) await storeSession(existing.deviceId, existing.cryptoKey, res.data)
  } catch {
    // Offline, server unreachable, or the device was revoked — silently
    // retried on the next call to this function (next login, next reconnect
    // in a later phase). Never surfaced as a login-blocking error.
  }
}

// Decrypts and returns the currently stored device-session credential, or
// null if there isn't a usable one (nothing registered yet, or it expired
// and couldn't be renewed). Later phases use this to authenticate sync calls.
export async function getValidDeviceCredential(): Promise<string | null> {
  const existing = await offlineDb.deviceMeta.get('device')
  if (!existing?.encryptedCredential || !existing.credentialIv || !existing.credentialExpiresAt) return null
  if (new Date(existing.credentialExpiresAt).getTime() <= Date.now()) return null

  try {
    return await decryptCredential(existing.cryptoKey, existing.credentialIv, existing.encryptedCredential)
  } catch {
    return null
  }
}
