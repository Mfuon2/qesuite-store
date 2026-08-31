import { describe, test, expect, beforeEach } from 'bun:test'
import { setActivePinia, createPinia } from 'pinia'
import { offlineDb } from '../db'
import { useAccessStore } from '@/stores/access'

beforeEach(async () => {
  setActivePinia(createPinia())
  await offlineDb.sessionCache.clear()
})

describe('access store offline session cache', () => {
  test('loadFromCache returns false when nothing has ever been cached', async () => {
    const access = useAccessStore()
    expect(await access.loadFromCache()).toBe(false)
    expect(access.loaded).toBe(false)
  })

  test('loadFromCache restores a previously cached permission grant without any network call', async () => {
    await offlineDb.sessionCache.put({
      id: 'session', role: 'staff', isOwner: false,
      permissions: ['pos.view', 'pos.create_sale'], cachedAt: new Date().toISOString(),
    })

    const access = useAccessStore()
    const ok = await access.loadFromCache()
    expect(ok).toBe(true)
    expect(access.loaded).toBe(true)
    expect(access.can('pos.create_sale')).toBe(true)
    expect(access.can('settings.edit')).toBe(false)
  })

  test('an owner\'s cached grant satisfies every permission via is_owner, same as the live path', async () => {
    await offlineDb.sessionCache.put({
      id: 'session', role: 'owner', isOwner: true, permissions: [], cachedAt: new Date().toISOString(),
    })

    const access = useAccessStore()
    await access.loadFromCache()
    expect(access.can('anything.at_all')).toBe(true)
  })
})
