import { describe, test, expect } from 'bun:test'
import { uuid7 } from '../uuid7'

describe('uuid7', () => {
  test('produces a well-formed UUID string', () => {
    const id = uuid7()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  test('is unique across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuid7()))
    expect(ids.size).toBe(1000)
  })

  test('sorts lexicographically by creation time (unlike UUIDv4)', async () => {
    const first = uuid7()
    await new Promise(r => setTimeout(r, 5))
    const second = uuid7()
    expect(first < second).toBe(true)
  })
})
