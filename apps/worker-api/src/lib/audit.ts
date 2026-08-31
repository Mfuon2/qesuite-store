import { generateId } from '@qesuite/shared'

type AuditEntry = {
  actorId: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  detail?: Record<string, unknown>
  ip?: string | null
}

/**
 * Build a D1 prepared statement for one audit_log row, meant to be pushed
 * into the same c.env.qesuite_db.batch(...) call as the write it's auditing —
 * keeps the write and its audit trail atomic instead of a separate round trip.
 */
export function auditEntry(db: D1Database, entry: AuditEntry): D1PreparedStatement {
  return db.prepare(
    `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    generateId(), entry.actorId, entry.actorRole, entry.action, entry.targetType, entry.targetId,
    entry.detail ? JSON.stringify(entry.detail) : null,
    entry.ip ?? null,
  )
}
