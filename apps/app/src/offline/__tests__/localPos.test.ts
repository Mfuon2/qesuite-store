import { describe, test, expect, beforeEach } from 'bun:test'
import { offlineDb } from '../db'
import { ringSaleOffline, voidSaleOffline } from '../localPos'

async function seedProduct(overrides: Partial<{ id: string; stock: number; price: number }> = {}) {
  const id = overrides.id ?? 'prod-1'
  await offlineDb.productsCache.put({
    id, name: 'Test Soap', price: overrides.price ?? 100, salePrice: null,
    stock: overrides.stock ?? 10, costPrice: 60, isActive: true, categoryId: null, updatedAt: new Date().toISOString(),
  })
  return id
}

async function seedCustomer(overrides: Partial<{ id: string; creditLimit: number; creditBalance: number }> = {}) {
  const id = overrides.id ?? 'cust-1'
  await offlineDb.customersCache.put({
    id, name: 'Jane', phone: '0712345678', email: null,
    creditLimit: overrides.creditLimit ?? 5000, creditBalance: overrides.creditBalance ?? 0,
  })
  return id
}

beforeEach(async () => {
  await Promise.all([
    offlineDb.productsCache.clear(),
    offlineDb.customersCache.clear(),
    offlineDb.salesLocal.clear(),
    offlineDb.outboxMutations.clear(),
  ])
})

describe('ringSaleOffline', () => {
  test('commits a cash sale locally, decrements cached stock, and queues one outbox mutation', async () => {
    await seedProduct({ stock: 10 })

    const outcome = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 3 }], paymentMethod: 'cash' })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.total).toBe(300)

    const product = await offlineDb.productsCache.get('prod-1')
    expect(product?.stock).toBe(7)

    const sale = await offlineDb.salesLocal.get(outcome.saleId)
    expect(sale?.status).toBe('pending_sync')
    expect(sale?.receiptCode).toBe(outcome.receiptCode)

    const mutations = await offlineDb.outboxMutations.toArray()
    expect(mutations).toHaveLength(1)
    expect(mutations[0]!.id).toBe(outcome.saleId)
    expect(mutations[0]!.entityType).toBe('pos_sale')
    expect(mutations[0]!.state).toBe('pending')
  })

  test('rejects when cached stock is insufficient, and queues nothing', async () => {
    await seedProduct({ stock: 2 })

    const outcome = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 5 }], paymentMethod: 'cash' })
    expect(outcome.ok).toBe(false)

    const product = await offlineDb.productsCache.get('prod-1')
    expect(product?.stock).toBe(2) // untouched
    expect(await offlineDb.outboxMutations.count()).toBe(0)
  })

  test('a credit sale updates the cached customer balance optimistically, even over their limit', async () => {
    await seedProduct({ stock: 10, price: 1000 })
    await seedCustomer({ creditLimit: 500, creditBalance: 0 })

    // 2 x 1000 = 2000, well over the 500 limit — still commits locally.
    // Local-first means the till never blocks the sale; the server's
    // approval queue is what arbitrates the over-limit case once this syncs.
    const outcome = await ringSaleOffline({
      items: [{ productId: 'prod-1', quantity: 2 }], paymentMethod: 'credit', customerId: 'cust-1',
    })
    expect(outcome.ok).toBe(true)

    const customer = await offlineDb.customersCache.get('cust-1')
    expect(customer?.creditBalance).toBe(2000)
  })

  test('rejects a credit sale for a customer not present in the local cache', async () => {
    await seedProduct()
    const outcome = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 1 }], paymentMethod: 'credit', customerId: 'unknown' })
    expect(outcome.ok).toBe(false)
  })

  test('multiple sales in a row accumulate as independent, uniquely-identified outbox mutations', async () => {
    await seedProduct({ stock: 100 })
    const first = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 1 }], paymentMethod: 'cash' })
    const second = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 1 }], paymentMethod: 'cash' })
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return

    expect(first.saleId).not.toBe(second.saleId)
    expect(await offlineDb.outboxMutations.count()).toBe(2)
    expect(await offlineDb.salesLocal.count()).toBe(2)

    const product = await offlineDb.productsCache.get('prod-1')
    expect(product?.stock).toBe(98)
  })
})

describe('voidSaleOffline', () => {
  test('restocks the item, marks the local sale voided, and queues a pos_void mutation', async () => {
    await seedProduct({ stock: 10 })
    const sale = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 4 }], paymentMethod: 'cash' })
    expect(sale.ok).toBe(true)
    if (!sale.ok) return

    const result = await voidSaleOffline(sale.saleId, 'Rang up the wrong item')
    expect(result.ok).toBe(true)

    const product = await offlineDb.productsCache.get('prod-1')
    expect(product?.stock).toBe(10) // fully restored

    const localSale = await offlineDb.salesLocal.get(sale.saleId)
    expect(localSale?.status).toBe('voided')

    const voidMutations = (await offlineDb.outboxMutations.toArray()).filter(m => m.entityType === 'pos_void')
    expect(voidMutations).toHaveLength(1)
  })

  test('rejects voiding the same sale twice', async () => {
    await seedProduct({ stock: 10 })
    const sale = await ringSaleOffline({ items: [{ productId: 'prod-1', quantity: 1 }], paymentMethod: 'cash' })
    if (!sale.ok) throw new Error('setup failed')

    expect((await voidSaleOffline(sale.saleId, 'first void')).ok).toBe(true)
    expect((await voidSaleOffline(sale.saleId, 'second void')).ok).toBe(false)
  })

  test('rejects voiding a sale that does not exist locally', async () => {
    const result = await voidSaleOffline('does-not-exist', 'reason')
    expect(result.ok).toBe(false)
  })
})
