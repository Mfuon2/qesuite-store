import { offlineDb } from './db'
import { uuid7 } from './uuid7'
import { notifyOutboxChanged } from './outbox'

export interface LocalSaleCartItem {
  productId: string
  quantity: number
}

export interface LocalSaleInput {
  items: LocalSaleCartItem[]
  paymentMethod: 'cash' | 'credit'
  discount?: number
  tableLabel?: string
  note?: string
  customerId?: string
}

export type LocalSaleOutcome =
  | { ok: true; saleId: string; receiptCode: string; total: number }
  | { ok: false; error: string }

function generateReceiptCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// The local-first mirror of apps/worker-api/src/lib/posSale.ts's
// resolvePosSale: validate against the CACHED catalog, commit locally in one
// Dexie transaction (sale + stock decrement + outbox mutation together, so
// they can never drift apart), and return immediately. The network is never
// on this path — a later, independent sync cycle replays the queued
// mutation server-side (see syncEngine.ts).
export async function ringSaleOffline(input: LocalSaleInput): Promise<LocalSaleOutcome> {
  if (!input.items.length) return { ok: false, error: 'Add at least one item' }

  try {
    return await offlineDb.transaction(
      'rw', offlineDb.productsCache, offlineDb.customersCache, offlineDb.salesLocal, offlineDb.outboxMutations,
      async () => {
        let subtotal = 0
        const resolvedItems: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; stockAfter: number }> = []

        for (const line of input.items) {
          const product = await offlineDb.productsCache.get(line.productId)
          if (!product || !product.isActive) throw new Error(`Product not available: ${line.productId}`)
          if (product.stock < line.quantity) throw new Error(`Insufficient stock for ${product.name}`)
          const unitPrice = product.salePrice ?? product.price
          const lineTotal = unitPrice * line.quantity
          subtotal += lineTotal
          resolvedItems.push({
            productId: product.id, productName: product.name, quantity: line.quantity,
            unitPrice, lineTotal, stockAfter: product.stock - line.quantity,
          })
        }

        const discount = Math.max(0, input.discount ?? 0)
        if (discount > subtotal) throw new Error('Discount cannot exceed the subtotal')
        const total = Math.max(0, subtotal - discount)

        if (input.paymentMethod === 'credit') {
          if (!input.customerId) throw new Error('A customer is required for a credit sale')
          const customer = await offlineDb.customersCache.get(input.customerId)
          if (!customer) throw new Error('Customer not found locally — this device needs to sync at least once online before selling to them on credit')
          // Deliberately not hard-blocked over the cached limit — this
          // commits optimistically; the server's approval queue is the real
          // arbiter once the mutation syncs (see routes/sync.ts).
          await offlineDb.customersCache.update(input.customerId, { creditBalance: customer.creditBalance + total })
        }

        const saleId = uuid7()
        const receiptCode = generateReceiptCode()

        for (const item of resolvedItems) {
          await offlineDb.productsCache.update(item.productId, { stock: item.stockAfter })
        }

        await offlineDb.salesLocal.put({
          id: saleId, receiptCode, subtotal, discount, total, paymentMethod: input.paymentMethod,
          customerId: input.customerId, status: 'pending_sync', createdAt: new Date().toISOString(),
          items: resolvedItems.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
        })

        await offlineDb.outboxMutations.put({
          id: saleId, entityType: 'pos_sale', createdAt: new Date().toISOString(), state: 'pending', retryCount: 0,
          payload: {
            items: input.items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
            payment_method: input.paymentMethod,
            discount: discount || undefined,
            table_label: input.tableLabel,
            note: input.note,
            customer_id: input.customerId,
            receipt_code: receiptCode,
          },
        })

        return { ok: true, saleId, receiptCode, total } as const
      },
    ).then(result => {
      notifyOutboxChanged()
      return result
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to ring up sale' }
  }
}

export async function voidSaleOffline(saleId: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!reason.trim()) return { ok: false, error: 'A reason is required' }

  try {
    return await offlineDb.transaction(
      'rw', offlineDb.salesLocal, offlineDb.productsCache, offlineDb.outboxMutations,
      async () => {
        const sale = await offlineDb.salesLocal.get(saleId)
        if (!sale) throw new Error('Sale not found locally')
        if (sale.status === 'voided') throw new Error('Sale is already voided')

        for (const item of sale.items) {
          const product = await offlineDb.productsCache.get(item.productId)
          if (product) await offlineDb.productsCache.update(item.productId, { stock: product.stock + item.quantity })
        }

        await offlineDb.salesLocal.update(saleId, { status: 'voided' })

        await offlineDb.outboxMutations.put({
          id: uuid7(), entityType: 'pos_void', createdAt: new Date().toISOString(), state: 'pending', retryCount: 0,
          payload: { sale_id: saleId, reason },
        })

        return { ok: true } as const
      },
    ).then(result => {
      notifyOutboxChanged()
      return result
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to void sale' }
  }
}
