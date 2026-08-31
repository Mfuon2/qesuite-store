import { generateId, generateTrackingCode } from './jwt'
import { nextSequenceNumber } from './sequences'

// Shared between the immediate POST /api/pos path and the deferred
// credit_limit_override approval path (apps/worker-api/src/routes/approvals.ts),
// so both validate/resolve stock and prices fresh rather than trusting
// request-time data that may be stale by the time a manager approves.

export type PosPaymentMethod = 'cash' | 'mpesa' | 'card' | 'split' | 'credit'
export type PosSplitLegMethod = 'cash' | 'mpesa' | 'card'
export type PosSplitLeg = { method: PosSplitLegMethod; amount: number; reference?: string }

export interface PosSaleInput {
  items: Array<{ product_id: string; quantity: number }>
  payment_method: PosPaymentMethod
  amount_tendered?: number
  mpesa_reference?: string
  payments?: PosSplitLeg[]
  discount?: number
  table_label?: string
  note?: string
  customer_id?: string
  // Present only when this input originated offline (see routes/sync.ts) —
  // the receipt code the cashier already saw locally before this ever
  // reached the server.
  receipt_code?: string
}

export interface ResolvedItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  cost_price: number
  stock_after: number
}

export interface OpenTill {
  id: string
  running_float: number
}

export type PosSaleOutcome =
  | { ok: false; status: 400; error: string }
  | {
      ok: true
      saleId: string
      receiptCode: string
      subtotal: number
      discount: number
      total: number
      amountTendered: number | null
      changeDue: number | null
      cashLegTotal: number
      resolvedItems: ResolvedItem[]
      statements: D1PreparedStatement[]
    }

function validKesAmount(value: unknown, opts: { allowZero?: boolean } = {}): value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) return false
  return opts.allowZero ? value >= 0 : value > 0
}

// Validates input, re-reads current stock/prices, and builds the full
// statement list for a sale (pos_sales, pos_sale_items, stock decrement,
// stock_movements, split legs, cash movement). Never touches the database
// except for read-only lookups — the caller runs `db.batch(statements)`.
export async function resolvePosSale(
  db: D1Database,
  tenantId: string,
  userId: string,
  till: OpenTill,
  input: PosSaleInput,
  // The offline sync push path (routes/sync.ts) passes the client-generated
  // UUIDv7 the mutation was queued under, so the sale is created under the
  // same id the device already committed locally — never a server-minted
  // one — which is what lets dependency ordering and idempotent retries work
  // without any server-side id remapping. Omitted (server generates one) for
  // the ordinary online POST /api/pos path and the credit_limit_override
  // approval-execute path, which have no client id to preserve.
  clientSaleId?: string,
  // Likewise, an offline-created sale's receipt code is generated on-device
  // so what the cashier sees on the local receipt never changes once
  // synced — the server only re-validates uniqueness rather than minting a
  // different code the client already showed the customer.
  clientReceiptCode?: string,
  // Set only by the offline sync-replay path (routes/sync.ts): the sale
  // already physically happened at the till while offline — rejecting it
  // after the fact because stock has since sold out elsewhere doesn't undo
  // that, it just leaves the books wrong. Instead of blocking, this lets
  // stock go negative (a visible signal for the owner to reconcile) and
  // records the true oversold quantity in the stock_movements ledger rather
  // than silently clamping it away. Never set for the ordinary online path,
  // which still rejects an oversell in real time as before.
  allowNegativeStock = false,
): Promise<PosSaleOutcome> {
  if (!input.items?.length) return { ok: false, status: 400, error: 'items is required' }
  if (input.items.length > 50) return { ok: false, status: 400, error: 'Too many items' }
  if (!['cash', 'mpesa', 'card', 'split', 'credit'].includes(input.payment_method)) {
    return { ok: false, status: 400, error: 'Invalid payment method' }
  }
  if (input.payment_method === 'mpesa' && !input.mpesa_reference?.trim()) {
    return { ok: false, status: 400, error: 'mpesa_reference is required for M-Pesa sales' }
  }
  if (input.payment_method === 'credit' && !input.customer_id) {
    return { ok: false, status: 400, error: 'customer_id is required for a credit sale' }
  }
  if (input.payment_method === 'split') {
    if (!Array.isArray(input.payments) || input.payments.length < 2) {
      return { ok: false, status: 400, error: 'A split payment needs at least two payment legs' }
    }
    for (const leg of input.payments) {
      if (!['cash', 'mpesa', 'card'].includes(leg.method)) {
        return { ok: false, status: 400, error: 'Each split leg must be cash, mpesa, or card' }
      }
      if (!validKesAmount(leg.amount)) {
        return { ok: false, status: 400, error: 'Each split leg needs a positive whole KES amount' }
      }
      if (leg.method === 'mpesa' && !leg.reference?.trim()) {
        return { ok: false, status: 400, error: 'An M-Pesa reference is required for each M-Pesa leg' }
      }
    }
  }
  if (input.table_label && input.table_label.length > 60) return { ok: false, status: 400, error: 'Table label too long' }
  if (input.note && input.note.length > 500) return { ok: false, status: 400, error: 'Note too long' }

  let subtotal = 0
  const resolvedItems: ResolvedItem[] = []

  for (const item of input.items) {
    if (!item.product_id || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, status: 400, error: 'Each item needs product_id and a whole quantity of at least 1' }
    }

    const product = await db.prepare(
      'SELECT id, name, price, sale_price, stock, is_active, cost_price FROM products WHERE id = ? AND tenant_id = ?'
    ).bind(item.product_id, tenantId).first<{
      id: string; name: string; price: number; sale_price: number | null
      stock: number; is_active: number; cost_price: number
    }>()

    if (!product || !product.is_active) return { ok: false, status: 400, error: `Product ${item.product_id} not available` }
    if (product.stock < item.quantity && !allowNegativeStock) {
      return { ok: false, status: 400, error: `Insufficient stock for ${product.name}` }
    }

    const unitPrice = product.sale_price ?? product.price
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal
    resolvedItems.push({
      id: generateId(),
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      cost_price: product.cost_price,
      stock_after: product.stock - item.quantity,
    })
  }

  if (input.discount !== undefined && !validKesAmount(input.discount, { allowZero: true })) {
    return { ok: false, status: 400, error: 'Discount must be a non-negative whole KES amount' }
  }
  const discount = Math.max(0, input.discount ?? 0)
  if (discount > subtotal) return { ok: false, status: 400, error: 'Discount cannot exceed the subtotal' }
  const total = Math.max(0, subtotal - discount)

  if (input.payment_method === 'split') {
    const legSum = input.payments!.reduce((sum, leg) => sum + leg.amount, 0)
    if (legSum !== total) return { ok: false, status: 400, error: `Split payment legs total ${legSum} but the sale total is ${total}` }
  }

  let amountTendered: number | null = null
  let changeDue: number | null = null
  if (input.payment_method === 'cash' && input.amount_tendered !== undefined) {
    if (!validKesAmount(input.amount_tendered, { allowZero: true })) {
      return { ok: false, status: 400, error: 'Amount tendered must be a non-negative whole KES amount' }
    }
    if (input.amount_tendered < total) return { ok: false, status: 400, error: 'Amount tendered is less than the total' }
    amountTendered = input.amount_tendered
    changeDue = input.amount_tendered - total
  }

  let receiptCode = clientReceiptCode ?? generateTrackingCode()
  if (clientReceiptCode) {
    const taken = await db.prepare('SELECT id FROM pos_sales WHERE tenant_id = ? AND receipt_code = ?').bind(tenantId, receiptCode).first()
    if (taken) return { ok: false, status: 400, error: 'This receipt code was already used — regenerate and retry' }
  } else {
    while (true) {
      const exists = await db.prepare('SELECT id FROM pos_sales WHERE tenant_id = ? AND receipt_code = ?').bind(tenantId, receiptCode).first()
      if (!exists) break
      receiptCode = generateTrackingCode()
    }
  }

  const saleId = clientSaleId ?? generateId()

  const cashLegTotal = input.payment_method === 'cash'
    ? total
    : input.payment_method === 'split'
      ? input.payments!.filter(leg => leg.method === 'cash').reduce((sum, leg) => sum + leg.amount, 0)
      : 0

  const statements: D1PreparedStatement[] = [
    db.prepare(
      `INSERT INTO pos_sales (id, tenant_id, receipt_code, subtotal, discount, total, payment_method,
        amount_tendered, change_due, mpesa_reference, status, table_label, note, served_by,
        served_by_user_id, created_at, till_session_id, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, datetime('now'), ?, ?)`
    ).bind(
      saleId, tenantId, receiptCode, subtotal, discount, total, input.payment_method,
      amountTendered, changeDue, input.payment_method === 'mpesa' ? input.mpesa_reference?.trim() : null,
      input.table_label ?? null, input.note ?? null, userId, userId, till.id,
      input.payment_method === 'credit' ? input.customer_id : null,
    ),
    ...resolvedItems.map(item =>
      db.prepare(
        'INSERT INTO pos_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(item.id, saleId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total)
    ),
    ...resolvedItems.map(item =>
      db.prepare(
        allowNegativeStock
          ? 'UPDATE products SET stock = stock - ? WHERE id = ?'
          : 'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?'
      ).bind(item.quantity, item.product_id)
    ),
    ...resolvedItems.map(item =>
      db.prepare(
        `INSERT INTO stock_movements
          (id, tenant_id, product_id, type, quantity_delta, unit_cost, resulting_stock, resulting_avg_cost, reference_type, reference_id, recorded_by, reason)
         VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, 'pos_sale', ?, ?, ?)`
      ).bind(
        generateId(), tenantId, item.product_id, -item.quantity, item.cost_price,
        allowNegativeStock ? item.stock_after : Math.max(0, item.stock_after),
        item.cost_price, saleId, userId,
        allowNegativeStock && item.stock_after < 0 ? 'Oversold while offline — reconcile with a stock count' : null,
      )
    ),
    ...(input.payment_method === 'split' ? input.payments!.map(leg =>
      db.prepare(
        'INSERT INTO pos_sale_payments (id, sale_id, tenant_id, method, amount, reference) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(generateId(), saleId, tenantId, leg.method, leg.amount, leg.reference?.trim() ?? null)
    ) : []),
    ...(cashLegTotal > 0 ? [
      db.prepare(
        `INSERT INTO pos_cash_movements
          (id, tenant_id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at)
         VALUES (?, ?, ?, 'cash_sale', ?, ?, ?, ?, datetime('now'))`
      ).bind(generateId(), tenantId, till.id, cashLegTotal, `Cash sale ${receiptCode}`, saleId, userId),
    ] : []),
  ]

  return { ok: true, saleId, receiptCode, subtotal, discount, total, amountTendered, changeDue, cashLegTotal, resolvedItems, statements }
}

// A credit sale is booked to accounts receivable as a real, already-sent
// invoice (one line per item) rather than a parallel ledger — so the
// existing AR aging report, payment recording, write-off, and credit-note
// machinery all work on it unchanged. 30 days is a conservative, standard
// trade-credit default; there is no per-tenant credit-terms setting today.
const POS_CREDIT_TERMS_DAYS = 30

export type VoidOutcome =
  | { ok: false; status: 400 | 404 | 409; error: string }
  | { ok: true; statements: D1PreparedStatement[]; runningFloatDelta: number }

// Shared by the online POST /api/pos/:id/void route and the offline sync
// push path (routes/sync.ts) — both need to reverse a completed sale and,
// if it was a credit sale, reverse the accounts-receivable booking too.
export async function buildVoidStatements(
  db: D1Database,
  tenantId: string,
  userId: string,
  saleId: string,
  reason: string,
  till: OpenTill | null,
): Promise<VoidOutcome> {
  if (!reason.trim() || reason.trim().length > 300) {
    return { ok: false, status: 400, error: 'reason is required' }
  }

  const sale = await db.prepare(
    'SELECT id, receipt_code, status, payment_method, total FROM pos_sales WHERE id = ? AND tenant_id = ?'
  ).bind(saleId, tenantId).first<{ id: string; receipt_code: string; status: string; payment_method: PosPaymentMethod; total: number }>()
  if (!sale) return { ok: false, status: 404, error: 'Sale not found' }
  if (sale.status === 'voided') return { ok: false, status: 400, error: 'Sale is already voided' }

  if (sale.payment_method === 'cash' && !till) {
    return { ok: false, status: 409, error: 'Open the POS till before refunding a cash sale' }
  }

  let creditInvoice: { id: string; total: number; amount_paid: number; customer_id: string | null } | null = null
  if (sale.payment_method === 'credit') {
    creditInvoice = await db.prepare(
      `SELECT id, total, amount_paid, customer_id FROM invoices WHERE pos_sale_id = ? AND tenant_id = ? AND status != 'void'`
    ).bind(saleId, tenantId).first<{ id: string; total: number; amount_paid: number; customer_id: string | null }>()
    if (creditInvoice && creditInvoice.amount_paid > 0) {
      return { ok: false, status: 409, error: 'The customer has already paid part of this credit sale — issue a credit note or write-off in Billing instead of voiding' }
    }
  }

  const items = await db.prepare(
    'SELECT product_id, quantity FROM pos_sale_items WHERE sale_id = ?'
  ).bind(saleId).all<{ product_id: string | null; quantity: number }>()

  const runningFloatDelta = sale.payment_method === 'cash' && till && sale.total > 0 ? -sale.total : 0

  const statements: D1PreparedStatement[] = [
    db.prepare(
      `UPDATE pos_sales SET status = 'voided', void_reason = ?, voided_by_user_id = ?, voided_at = datetime('now') WHERE id = ? AND tenant_id = ?`
    ).bind(reason.trim(), userId, saleId, tenantId),
    ...items.results.filter(item => item.product_id).map(item =>
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').bind(item.quantity, item.product_id)
    ),
    ...(sale.payment_method === 'cash' && till && sale.total > 0 ? [
      db.prepare(
        `INSERT INTO pos_cash_movements (id, tenant_id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at)
         VALUES (?, ?, ?, 'cash_void', ?, ?, ?, ?, datetime('now'))`
      ).bind(generateId(), tenantId, till.id, -sale.total, `Void ${sale.receipt_code}: ${reason.trim()}`, saleId, userId),
    ] : []),
    ...(creditInvoice ? [
      db.prepare(
        `UPDATE invoices SET status = 'void', void_reason = ?, voided_by = ?, voided_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
      ).bind(`POS sale ${sale.receipt_code} voided: ${reason.trim()}`, userId, creditInvoice.id),
      ...(creditInvoice.customer_id ? [
        db.prepare('UPDATE customers SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?')
          .bind(creditInvoice.total - creditInvoice.amount_paid, creditInvoice.customer_id),
      ] : []),
    ] : []),
  ]

  return { ok: true, statements, runningFloatDelta }
}

export async function buildCreditBookingStatements(
  db: D1Database,
  tenantId: string,
  userId: string,
  customer: { id: string; name: string; phone: string | null },
  sale: { saleId: string; receiptCode: string; total: number },
  resolvedItems: ResolvedItem[],
): Promise<D1PreparedStatement[]> {
  const invoiceId = generateId()
  const invoiceNumber = await nextSequenceNumber(db, tenantId, 'invoice_invoice', 'INV')
  const dueDate = new Date(Date.now() + POS_CREDIT_TERMS_DAYS * 86_400_000).toISOString().slice(0, 10)

  return [
    db.prepare(
      `INSERT INTO invoices
        (id, tenant_id, invoice_number, customer_id, customer_name, customer_phone, type, status,
         subtotal, discount, tax_amount, total, amount_paid, payment_terms_days, due_date, notes, created_by, pos_sale_id)
       VALUES (?, ?, ?, ?, ?, ?, 'invoice', 'sent', ?, 0, 0, ?, 0, ?, ?, ?, ?, ?)`
    ).bind(
      invoiceId, tenantId, invoiceNumber, customer.id, customer.name, customer.phone,
      sale.total, sale.total, POS_CREDIT_TERMS_DAYS, dueDate, `POS credit sale, receipt ${sale.receiptCode}`, userId, sale.saleId,
    ),
    ...resolvedItems.map(item => db.prepare(
      `INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(generateId(), invoiceId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total)),
    db.prepare('UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?').bind(sale.total, customer.id),
  ]
}
