/**
 * Atomically allocate the next number in a per-tenant, per-sequence counter
 * using D1's INSERT ... ON CONFLICT DO UPDATE ... RETURNING — safe under
 * concurrent requests without a separate read-then-write race window.
 */
export async function nextSequenceNumber(
  db: D1Database,
  tenantId: string,
  sequenceName: string,
  prefix: string,
  pad = 4,
): Promise<string> {
  const row = await db.prepare(
    `INSERT INTO code_sequences (tenant_id, sequence_name, last_value)
     VALUES (?, ?, 1)
     ON CONFLICT(tenant_id, sequence_name) DO UPDATE SET last_value = last_value + 1
     RETURNING last_value`
  ).bind(tenantId, sequenceName).first<{ last_value: number }>()

  const value = row?.last_value ?? 1
  return `${prefix}-${String(value).padStart(pad, '0')}`
}
