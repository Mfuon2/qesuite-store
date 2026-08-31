import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { deviceSessionMiddleware } from '../middleware/auth'
import { getOpenTill } from './pos'
import { resolvePosSale, buildCreditBookingStatements, buildVoidStatements, type PosSaleInput } from '../lib/posSale'
import { generateId } from '../lib/jwt'

// Offline-first POS, Phase 2: the push/pull sync protocol itself.
//
// PUSH accepts a bounded batch of client-generated mutations and applies
// each independently — one invalid mutation in a batch never fails the
// others, since these are unrelated business events, not one atomic unit.
// Every mutation id is checked against `sync_mutations` first: replaying an
// already-applied (or already-rejected) mutation returns the SAME recorded
// result instead of re-running the underlying operation — this is the
// idempotency guarantee the transactional-outbox pattern depends on.
//
// PULL is cursor-based delta sync: give a device everything that changed
// (in the entities it needs cached — products, customers) since its last
// acknowledged position in `sync_change_log`, capped and paginated so a
// large tenant never forces one unbounded response.
const sync = new Hono<{ Bindings: Env; Variables: Variables }>()
sync.use('*', deviceSessionMiddleware)

const MAX_MUTATIONS_PER_PUSH = 50
const MAX_PULL_LIMIT = 500

type SupportedEntityType = 'pos_sale' | 'pos_void'

interface PushMutation {
  id: string
  entity_type: SupportedEntityType
  operation: 'create'
  payload: unknown
}

type MutationStatus = 'applied' | 'duplicate' | 'rejected' | 'pending_approval'
interface MutationResult {
  id: string
  status: MutationStatus
  result?: Record<string, unknown>
  error?: string
}

async function applyPosSaleMutation(
  db: D1Database, tenantId: string, userId: string, mutationId: string, payload: PosSaleInput,
): Promise<MutationResult> {
  const till = await getOpenTill(db, tenantId)
  if (!till) return { id: mutationId, status: 'rejected', error: 'No open till on this device — open one while online first' }

  // Re-validated against CURRENT stock/prices, exactly like the online path —
  // but an offline sale that turns out to have been oversold (stock sold out
  // on another device before this one synced) is accepted anyway, since it
  // already physically happened. Stock is allowed to go negative as a
  // visible signal to reconcile, rather than the sale being rejected after
  // the fact and quietly leaving the books wrong.
  const resolved = await resolvePosSale(db, tenantId, userId, till, payload, mutationId, payload.receipt_code, true)
  if (!resolved.ok) return { id: mutationId, status: 'rejected', error: resolved.error }

  if (payload.payment_method === 'credit') {
    const customer = await db.prepare(
      'SELECT id, name, phone, credit_limit, credit_balance FROM customers WHERE id = ? AND tenant_id = ?'
    ).bind(payload.customer_id, tenantId).first<{ id: string; name: string; phone: string | null; credit_limit: number; credit_balance: number }>()
    if (!customer) return { id: mutationId, status: 'rejected', error: 'Customer not found' }

    if (customer.credit_balance + resolved.total > customer.credit_limit) {
      const approvalId = generateId()
      await db.prepare(
        `INSERT INTO approval_requests (id, tenant_id, action_type, target_type, target_id, payload_json, reason, requested_by)
         VALUES (?, ?, 'credit_limit_override', 'customer', ?, ?, ?, ?)`
      ).bind(
        approvalId, tenantId, customer.id, JSON.stringify(payload),
        `Offline credit sale of ${resolved.total} would put ${customer.name} at ${customer.credit_balance + resolved.total}, over their ${customer.credit_limit} limit`,
        userId,
      ).run()
      return { id: mutationId, status: 'pending_approval', result: { approval_id: approvalId } }
    }

    resolved.statements.push(...await buildCreditBookingStatements(
      db, tenantId, userId, customer, { saleId: resolved.saleId, receiptCode: resolved.receiptCode, total: resolved.total }, resolved.resolvedItems,
    ))
  }

  await db.batch(resolved.statements)
  return { id: mutationId, status: 'applied', result: { entity_id: resolved.saleId, receipt_code: resolved.receiptCode, total: resolved.total } }
}

async function applyVoidMutation(
  db: D1Database, tenantId: string, userId: string, mutationId: string, payload: { sale_id?: string; reason?: string },
): Promise<MutationResult> {
  if (!payload.sale_id) return { id: mutationId, status: 'rejected', error: 'sale_id is required' }

  const sale = await db.prepare(
    'SELECT payment_method FROM pos_sales WHERE id = ? AND tenant_id = ?'
  ).bind(payload.sale_id, tenantId).first<{ payment_method: 'cash' | 'mpesa' | 'card' | 'split' | 'credit' }>()
  if (!sale) return { id: mutationId, status: 'rejected', error: 'Sale not found' }

  const till = sale.payment_method === 'cash' ? await getOpenTill(db, tenantId) : null
  const result = await buildVoidStatements(db, tenantId, userId, payload.sale_id, payload.reason ?? '', till)
  if (!result.ok) return { id: mutationId, status: 'rejected', error: result.error }

  await db.batch(result.statements)
  return { id: mutationId, status: 'applied', result: { entity_id: payload.sale_id } }
}

async function applyMutation(
  db: D1Database, tenantId: string, userId: string, mutation: PushMutation,
): Promise<MutationResult> {
  if (mutation.entity_type === 'pos_sale') {
    return applyPosSaleMutation(db, tenantId, userId, mutation.id, mutation.payload as PosSaleInput)
  }
  if (mutation.entity_type === 'pos_void') {
    return applyVoidMutation(db, tenantId, userId, mutation.id, mutation.payload as { sale_id?: string; reason?: string })
  }
  return { id: mutation.id, status: 'rejected', error: `Unsupported entity_type: ${mutation.entity_type}` }
}

// Every push/pull request carries a per-cycle correlation id from the client
// (see apps/app/src/offline/syncEngine.ts) — logged on both sides so a real
// issue is traceable end-to-end without ever needing mutation payloads or
// customer data in the log line itself.
function correlationId(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header('X-Sync-Correlation-Id') ?? 'none'
}

// POST /api/sync/v1/push
sync.post('/push', async (c) => {
  try {
    const session = c.get('deviceSession')!
    const body = await c.req.json<{ mutations?: PushMutation[] }>()

    if (!Array.isArray(body.mutations) || body.mutations.length === 0) {
      return c.json({ success: false, error: 'mutations is required', data: null }, 400)
    }
    if (body.mutations.length > MAX_MUTATIONS_PER_PUSH) {
      return c.json({ success: false, error: `A push batch can contain at most ${MAX_MUTATIONS_PER_PUSH} mutations`, data: null }, 400)
    }

    const results: MutationResult[] = []

    // Processed strictly in array order, never reordered or parallelized —
    // the client's outbox is a FIFO queue, so a sale's create mutation is
    // always pushed before a void mutation that targets it. That ordering
    // guarantee is what lets client-generated ids stand in for a dependency
    // graph without the server doing any id remapping.
    for (const mutation of body.mutations) {
      if (!mutation?.id || !mutation.entity_type) {
        results.push({ id: mutation?.id ?? 'unknown', status: 'rejected', error: 'Malformed mutation' })
        continue
      }

      const existing = await c.env.qesuite_db.prepare(
        'SELECT status, result_json FROM sync_mutations WHERE id = ?'
      ).bind(mutation.id).first<{ status: string; result_json: string }>()
      if (existing) {
        results.push({ id: mutation.id, status: 'duplicate', result: JSON.parse(existing.result_json) })
        continue
      }

      try {
        const outcome = await applyMutation(c.env.qesuite_db, session.tenant_id, session.user_id, mutation)
        results.push(outcome)
        await c.env.qesuite_db.prepare(
          `INSERT INTO sync_mutations (id, tenant_id, device_id, entity_type, entity_id, status, result_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          mutation.id, session.tenant_id, session.device_id, mutation.entity_type,
          (outcome.result?.entity_id as string | undefined) ?? null, outcome.status,
          JSON.stringify(outcome.result ?? { error: outcome.error }),
        ).run()
      } catch (err) {
        console.error(`[sync:${correlationId(c)}] push mutation error`, mutation.id, err)
        results.push({ id: mutation.id, status: 'rejected', error: 'Internal error applying mutation' })
      }
    }

    return c.json({ success: true, data: { results }, error: null })
  } catch (err) {
    console.error(`[sync:${correlationId(c)}] push error`, err)
    return c.json({ success: false, error: 'Push failed', data: null }, 500)
  }
})

// GET /api/sync/v1/pull?cursor=N&limit=200
sync.get('/pull', async (c) => {
  try {
    const session = c.get('deviceSession')!
    const tenantId = session.tenant_id
    const cursor = Math.max(0, parseInt(c.req.query('cursor') ?? '0', 10) || 0)
    const limit = Math.min(Math.max(1, parseInt(c.req.query('limit') ?? '200', 10) || 200), MAX_PULL_LIMIT)

    const rows = await c.env.qesuite_db.prepare(
      'SELECT seq, entity_type, entity_id FROM sync_change_log WHERE tenant_id = ? AND seq > ? ORDER BY seq LIMIT ?'
    ).bind(tenantId, cursor, limit).all<{ seq: number; entity_type: string; entity_id: string }>()

    if (!rows.results.length) {
      return c.json({ success: true, data: { changes: { products: [], customers: [] }, next_cursor: cursor, has_more: false }, error: null })
    }

    const productIds = [...new Set(rows.results.filter(r => r.entity_type === 'product').map(r => r.entity_id))]
    const customerIds = [...new Set(rows.results.filter(r => r.entity_type === 'customer').map(r => r.entity_id))]

    const products = productIds.length ? (await c.env.qesuite_db.prepare(
      `SELECT id, name, price, sale_price, stock, cost_price, is_active, category_id, updated_at
       FROM products WHERE tenant_id = ? AND id IN (${productIds.map(() => '?').join(',')})`
    ).bind(tenantId, ...productIds).all()).results : []

    const customers = customerIds.length ? (await c.env.qesuite_db.prepare(
      `SELECT id, name, phone, email, credit_limit, credit_balance
       FROM customers WHERE tenant_id = ? AND id IN (${customerIds.map(() => '?').join(',')})`
    ).bind(tenantId, ...customerIds).all()).results : []

    const nextCursor = rows.results[rows.results.length - 1].seq
    const hasMore = rows.results.length === limit

    // Convenience resume-point only — the client's own local commit is what
    // actually determines whether this batch is "consumed," never this row.
    c.env.qesuite_db.prepare('UPDATE pos_devices SET sync_cursor = ? WHERE id = ?')
      .bind(nextCursor, session.device_id).run().catch(() => {})

    return c.json({ success: true, data: { changes: { products, customers }, next_cursor: nextCursor, has_more: hasMore }, error: null })
  } catch (err) {
    console.error(`[sync:${correlationId(c)}] pull error`, err)
    return c.json({ success: false, error: 'Pull failed', data: null }, 500)
  }
})

export default sync
