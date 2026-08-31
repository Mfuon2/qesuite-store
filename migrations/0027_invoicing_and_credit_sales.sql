-- Customer-facing billing: quotations/pro-forma/recurring invoices, payment
-- terms and overdue tracking, credit/debit notes, and accounts-receivable
-- balance on customers. code_sequences backs atomic sequential numbering
-- (allocated via INSERT ... ON CONFLICT DO UPDATE ... RETURNING).

CREATE TABLE IF NOT EXISTS code_sequences (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  sequence_name TEXT NOT NULL,
  last_value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, sequence_name)
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  invoice_number TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_pin TEXT,
  type TEXT NOT NULL DEFAULT 'invoice' CHECK(type IN ('quotation','proforma','invoice','recurring')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','partially_paid','paid','overdue','void')),
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_terms_days INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  recurring_interval TEXT CHECK(recurring_interval IN ('weekly','monthly')),
  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  voided_by TEXT REFERENCES users(id),
  voided_at TEXT,
  void_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(tenant_id, due_date) WHERE due_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  note TEXT,
  recorded_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_tenant ON invoice_payments(tenant_id);

CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  credit_note_number TEXT NOT NULL,
  invoice_id TEXT REFERENCES invoices(id),
  customer_id TEXT REFERENCES customers(id),
  amount INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','applied','void')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_notes_tenant_number ON credit_notes(tenant_id, credit_note_number);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON credit_notes(invoice_id);

CREATE TABLE IF NOT EXISTS debit_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  debit_note_number TEXT NOT NULL,
  invoice_id TEXT REFERENCES invoices(id),
  customer_id TEXT REFERENCES customers(id),
  amount INTEGER NOT NULL,
  reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_debit_notes_tenant_number ON debit_notes(tenant_id, debit_note_number);
CREATE INDEX IF NOT EXISTS idx_debit_notes_invoice ON debit_notes(invoice_id);

ALTER TABLE customers ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN pin_number TEXT;
