-- Generic approval queue for sensitive actions (refunds, stock adjustments,
-- expense edits/deletes, credit write-offs). Purchase orders have their own
-- embedded draft/pending_approval/approved lifecycle and don't go through
-- this table. A single table keeps one inbox/UI/notification path instead of
-- one per action type; the action's own payload is captured as JSON and only
-- applied on approval.

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  action_type TEXT NOT NULL CHECK(action_type IN (
    'refund','stock_adjustment','expense_edit','expense_delete','credit_write_off'
  )),
  target_type TEXT,
  target_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  requested_by TEXT NOT NULL REFERENCES users(id),
  decided_by TEXT REFERENCES users(id),
  decision_note TEXT,
  decided_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_approval_tenant_status ON approval_requests(tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_approval_requester ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_target ON approval_requests(target_type, target_id);
