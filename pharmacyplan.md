# Pharmacy compliance features: P1–P5

## Context

The published PharmaSync gap analysis found Store has zero coverage in "Prescriptions & Compliance" — the one category that's specifically what makes pharmacy software different from general retail. This plan builds the full recommended priority list, in order:

- **P1** — prescription record + dispensing log tied to a sale
- **P2** — controlled-drug register (Schedule II–IV filtered view of P1)
- **P3** — expiry alerts, wiring up the already-stored `products.expiry_date`
- **P4** — pharmacist license-expiry tracking on staff, alerted the same way
- **P5** — returns as their own reason-coded, approval-routed workflow, split from POS void

Investigation surfaced a **hard prerequisite**: `apps/worker-api/src/routes/pos.ts` is entirely gated by `restaurantGuard` (`store_category !== 'food'` → 403). Pharmacy tenants cannot reach POS/till at all today, and P1/P5 both need POS access for pharmacy tenants. This becomes Phase 0.

All migrations are additive, numbered sequentially from `0032`, and never edit an already-numbered file. **Migrations should be handed off after each phase for the user to run themselves — do not auto-apply with `wrangler d1 migrations apply`.**

## Confirmed against real code (not just investigation notes)

- `middleware/tenant.ts`: `restaurantGuard` has exactly the shape shown below, used at exactly two mount points — `pos.ts:12` and `expenses.ts:11`.
- `middleware/access.ts`: `accessRules` is a flat array of `{ method?, path: RegExp, permissions, mode? }`, first-match-wins per method, currently 57 rules; owner always bypasses; staff checked by a single `user_permissions` COUNT query.
- `constants.ts`: `ACCESS_PERMISSION_GROUPS` is `[{ id, label, description, permissions: [{ key, label, operation }] }]`; `ACCESS_PRESETS` (owner/manager/cashier/stock_controller/accountant) are plain arrays of keys.
- `approval_requests` (migration `0026`) already has the exact `action_type`/`payload_json`/`status`/`requested_by`/`decided_by` shape needed to route returns through it — this is the table to reuse, not build new.

## Cross-cutting decisions (made, not left open)

1. **Category guard**: replace `restaurantGuard` with a `categoryGuard(...allowed)` factory. `expenses.ts` keeps food-only (`restaurantGuard = categoryGuard('food')`, unchanged behavior). `pos.ts` switches to `posGuard = categoryGuard('food', 'pharmacy')`. On the frontend, split `DashboardLayout.vue`'s single `isRestaurant`-gated array into `isRestaurant` (still gates Expenses only) and a new `usesPos` (gates POS for both categories) — naively widening `isRestaurant` alone would leak Expenses to pharmacy tenants, which isn't wanted.
2. **Patients**: new `patients` table, 1:1 FK to `customers.id`, created lazily on first clinical record. Keeps DOB/allergies/next-of-kin off every other tenant's `customers` rows.
3. **Dispensing ledger**: dispensing reuses the existing `stock_movements.type = 'sale'` — it doesn't need its own movement type. The sale already writes a fully-attributed ledger row; `dispensing_log` is the compliance record layered on top of the same event, not a second stock movement.
4. **P3/P4 alerts**: both SMS (via the existing cron+notifications_log dedup pattern used by subscription reminders) **and** an in-app dashboard banner — there's no existing "unread alert" UI to lean on, and SMS delivery alone isn't a strong enough guarantee for something with real regulatory exposure.
5. **P5 returns — approval-routed**: every return is created as a **pending `approval_requests` row** (`action_type='return'`); stock and any cash refund only move once a manager/accountant approves it via the existing Approvals view. `pos_returns.status` starts at `'pending_approval'`, becomes `'completed'` or `'rejected'` on decision.
6. Reuse `pos_cash_movements.movement_type = 'cash_void'` for a return's cash-refund leg (no new enum value) — that table has a live FK dependent (`expenses.cash_movement_id`), so widening it costs a second table-recreate for no real benefit; it already isn't broken out as a separate till-summary line.

---

## Phase 0 — Unblock POS for pharmacy tenants (no migration)

**Backend**
- `apps/worker-api/src/middleware/tenant.ts`: replace `restaurantGuard` with
  ```ts
  export function categoryGuard(...allowed: string[]) {
    return async (c, next) => {
      const tenant = await c.env.qesuite_db.prepare('SELECT store_category FROM tenants WHERE id = ?')
        .bind(c.get('user').tenant_id).first<{ store_category: string }>()
      if (!tenant || !allowed.includes(tenant.store_category)) {
        return c.json({ error: `This feature is only available for ${allowed.join('/')} stores`, data: null }, 403)
      }
      await next()
    }
  }
  export const restaurantGuard = categoryGuard('food')
  export const posGuard = categoryGuard('food', 'pharmacy')
  ```
- `apps/worker-api/src/routes/pos.ts`: import `posGuard` instead of `restaurantGuard`; `pos.use('*', authMiddleware, tenantGuard, posGuard)`.
- `apps/worker-api/src/routes/expenses.ts`: unchanged.

**Frontend**
- `apps/app/src/layouts/DashboardLayout.vue`: add `usesPos = computed(() => ['food','pharmacy'].includes(settingsStore.tenant?.store_category ?? ''))`; keep `isRestaurant` for Expenses; split the nav array so POS is under `usesPos` and Expenses stays under `isRestaurant`.
- `apps/app/src/views/dashboard/SalesTerminalView.vue` (~line 1130): widen the mount guard to `['food','pharmacy'].includes(...)`.
- `apps/app/src/views/dashboard/ExpensesView.vue`: unchanged.

**Verify**: type-check; on a `pharmacy`-category test tenant confirm `/pos` is reachable, a till opens, a sale rings and voids; confirm `/expenses` is still hidden/403s. Confirm `food` tenants are unaffected.

---

## Phase 1 — P1: Prescription record + dispensing log

**Migration `migrations/0032_pharmacy_prescriptions_and_dispensing.sql`**: new tables `patients` (FK `customers.id`), `prescriptions` (FK `patients.id`, `created_by → users.id`), `dispensing_log` (FK `prescriptions.id`, `sale_id → pos_sales.id`, `sale_item_id → pos_sale_items.id`, `product_id`, `quantity_dispensed`, `batch_number`, `dispensed_by → users.id`) — plus `BEFORE UPDATE`/`BEFORE DELETE` triggers making `dispensing_log` append-only (mirrors the immutability intent already implied by `pos_cash_movements`). Full column list and indexes to be finalized against the exact investigation notes at build time.

**Backend**
- New `apps/worker-api/src/routes/pharmacy.ts`, mounted `app.route('/api/pharmacy', pharmacyRoutes)` in `index.ts`, guarded `pharmacy.use('*', authMiddleware, tenantGuard, categoryGuard('pharmacy'))`. Endpoints: `GET/POST /patients`, `GET/PUT /patients/:id`, `GET /prescriptions`, `GET /dispensing-log`.
- `apps/worker-api/src/routes/pos.ts` `POST /api/pos`: extend each cart item to optionally carry `{ patient_id, prescriber_name, prescriber_license_number?, prescription_number?, batch_number?, notes? }`. The patient must already exist (created via `/api/pharmacy/patients` before checkout) — this endpoint only validates `patient_id` belongs to the tenant. For every item with prescription data, append `INSERT INTO prescriptions` + `INSERT INTO dispensing_log` to the **same atomic `batch()`** that writes the sale — dispensing must never exist without its sale or vice versa. Requires a new `pharmacy.dispense` permission on top of the existing `pos.create_sale` check for that call.

**Permissions**: new `pharmacy` group — `pharmacy.view` (Menu), `pharmacy.manage_patients` (Operate), `pharmacy.dispense` (Operate); add `pharmacy.view` + `pharmacy.dispense` to the `cashier` preset (front-counter staff dispense day one), leave `manage_patients` at owner/manager tier. New `accessRules` entries for `/api/pharmacy/patients*`, `/prescriptions`, `/dispensing-log`.

**Frontend**: `api/pharmacy.ts`, `stores/pharmacy.ts`, views `PatientsView.vue` / `PatientDetailView.vue` / `DispensingLogView.vue` under `views/dashboard/pharmacy/`, a `PrescriptionDetailsModal.vue` wired into `SalesTerminalView.vue`'s cart line (visible only when tenant category is `pharmacy`), new router routes gated by `pharmacy.view`, new "Pharmacy" nav group in `DashboardLayout.vue` gated by `isPharmacy`.

**Verify**: type-check; hand off `0032` for the user to apply; click through: open till → create/search patient → attach prescription to a line → complete sale → confirm `dispensing_log`/`prescriptions` rows and Dispensing Log view show it; confirm `food` tenants never see the Pharmacy nav.

---

## Phase 2 — P2: Controlled drug register

**Migration `migrations/0033_controlled_substance_schedule.sql`**: `ALTER TABLE products ADD COLUMN controlled_substance_schedule TEXT CHECK(... IN ('II','III','IV') OR NULL)`; same column added to `dispensing_log`, **snapshotted at dispense time** (not joined live) so the register reflects what was true when the drug left the shelf even if a product's classification is corrected later. Matching partial indexes.

**Backend**: `products.ts` create/update accepts the new field; `pos.ts`'s dispensing insert (Phase 1) copies the product's current schedule onto the new `dispensing_log` row; new `apps/worker-api/src/routes/pharmacy.ts` endpoint `GET /controlled-register` (joins dispensing_log/prescriptions/patients/products/users) plus a PDF export reusing `lib/pdf.ts`'s existing `buildDocumentPdf` helper.

**Permissions**: `pharmacy.controlled_register_view` (Sensitive), owner/manager tier only (not added to `cashier`).

**Frontend**: schedule select on the product form (pharmacy tenants only); new `ControlledRegisterView.vue` (date filter, table, PDF export) under the Pharmacy nav group.

**Verify**: type-check; hand off `0033`; test this ALTER-with-CHECK against local `wrangler d1` dev first since this exact combination has no prior precedent in the migration history; click through: schedule a product, dispense it, confirm it appears in the register and a non-scheduled item doesn't; confirm permission gating.

---

## Phase 3 — P3: Expiry alerts (no migration — `expiry_date` already exists)

**Backend**: `handlers/cron.ts` gains `runExpiryAlerts(env)`, added via one more `ctx.waitUntil(...)` in `handleCron()` (piggybacks the existing single daily trigger, no `wrangler.toml` change). Mirrors `runSubscriptionReminders`/`maybeSendReminder`'s tenant-loop + `notifications_log`-dedup shape, but with fixed 30/14/7/1/0-day milestones instead of Fibonacci backoff, scanning `pharmacy`-category tenants' products via the existing `idx_products_expiry` index. New `SMS_TEMPLATES.product_expiry_alert` in `constants.ts`. New `GET /api/pharmacy/alerts/summary` for the dashboard banner.

**Frontend**: `ComplianceAlertsBanner.vue`, fetched once on dashboard mount, shown only for pharmacy tenants with active alerts, session-dismissible (not permanently, given the compliance stakes).

**Verify**: type-check (no migration this phase); set a test product's `expiry_date` near, trigger the cron locally, confirm one SMS attempt logs and the banner shows it, confirm same-day re-run doesn't duplicate.

---

## Phase 4 — P4: Pharmacist license-expiry tracking

**Migration `migrations/0034_staff_license_tracking.sql`**: `ALTER TABLE users ADD COLUMN license_number/license_body/license_expiry_date TEXT`, plus a partial index on `license_expiry_date`.

**Backend**: `routes/access.ts`'s existing `GET/PUT /members` (already `ownerOnly`-gated, no new permission needed) extended to read/write the three fields. `cron.ts` gains `runLicenseExpiryAlerts(env)`, same milestone-dedup shape, notifying both owner and the staff member. New `SMS_TEMPLATES.staff_license_expiry_alert`. `alerts/summary` (Phase 3) extended with `expiring_licenses`.

**Types**: `StoreMember` in `packages/types/src/index.ts` gains the three nullable fields.

**Frontend**: `UsersAccessPanel.vue`'s member-detail pane gains the three fields, shown only for `role === 'staff'` on pharmacy tenants; banner extended to show license alerts too.

**Verify**: type-check; hand off `0034`; set a staff license-expiry near, trigger the cron, confirm both owner and staff get a logged SMS attempt and the banner surfaces it.

---

## Phase 5 — P5: Returns, approval-routed

**Migration `migrations/0035_returns_workflow.sql`**: table-recreate `stock_movements` to widen `type` CHECK with `'return'`, and `approval_requests` to widen `action_type` CHECK with `'return'` (SQLite can't ALTER a CHECK in place — same recreate pattern as `0030`; neither table has a dependent FK pointing at it, so no redirect-first step is needed, unlike `0030`'s `pos_sales` case). New `pos_returns` (`reason_code` CHECK enum, `refund_method`, `refund_amount`, `status CHECK(IN ('pending_approval','completed','rejected'))`, `original_sale_id → pos_sales.id`) and `pos_return_items` (per-line, `original_sale_item_id → pos_sale_items.id`).

**Backend** (`apps/worker-api/src/routes/pos.ts`, gated by `posGuard` — this benefits `food` tenants too, not pharmacy-only):
- `POST /api/pos/returns`: validates each `original_sale_item_id`'s remaining returnable quantity (originally sold minus already-returned, summed over prior `pos_return_items`), then in one atomic `batch()`: `INSERT INTO pos_returns (status='pending_approval')`, `INSERT INTO pos_return_items`, `INSERT INTO approval_requests (action_type='return', target_type='pos_return', target_id=<return id>, payload_json=<items/refund details>, requested_by)`. **No stock or cash movement yet.**
- `apps/worker-api/src/routes/approvals.ts` `POST /:id/approve`: new branch for `action_type === 'return'` — parses `payload_json`, re-validates returnable quantity (guards against a second return request approved in between), requires an open till if `refund_method === 'cash'` (else 423 asking the approver to open one), then executes: `UPDATE products SET stock = stock + ?` + `INSERT INTO stock_movements (type='return', reference_type='pos_return', ...)` per line, optional `pos_cash_movements` row (`movement_type='cash_void'`, negative amount), and `UPDATE pos_returns SET status='completed'`.
- `POST /:id/reject`: existing generic handler additionally sets `pos_returns.status='rejected'` when `action_type === 'return'`.
- `GET /api/pos/returns`, `GET /api/pos/returns/:id`: list/detail, tenant-scoped.
- Existing `POST /:id/void` is unchanged — stays the "cancel this sale, same session" tool; returns is the new "customer brings it back later" tool.

**Permissions**: new `returns` group — `returns.view` (Menu), `returns.process` (Operate — *requesting* a return, not deciding it). Deciding uses the existing `approvals.decide` permission, unchanged. New `accessRules` entries placed **above** the existing generic `pos.view`/GET catch-all (first-match-wins).

**Frontend**: `stores/pos.ts` gains `createReturn`/`fetchReturns`/`fetchReturn`; new `ReturnModal.vue` (reason-code dropdown, not freeform text; original-sale lookup; per-line quantity capped at remaining returnable qty); `SalesTerminalView.vue` gets a "Process return" entry point (`returns.process`) and a Returns tab (`returns.view`); `ApprovalsView.vue`'s `ACTION_ICON`/`describe()` get a `'return'` case.

**Verify**: type-check; hand off `0035`; click through: ring a sale → request a partial return with a reason code + cash refund → confirm it sits pending in Approvals, no stock/cash change yet → approve it → confirm stock increases, a `stock_movements` row (`type='return'`) and a `pos_cash_movements` row exist, `pos_returns.status='completed'` → confirm rejecting a request leaves stock untouched and sets `status='rejected'` → confirm over-returning past remaining quantity is rejected at both request and approval time → confirm a user without `returns.process` can't request one, and one without `approvals.decide` can't approve.

---

## Overall cadence

- `bun run --filter '*' type-check` after every phase (no test suite exists — this is the primary gate).
- Hand off each phase's migration file(s) explicitly; never run `wrangler d1 migrations apply` automatically.
- Run `wrangler dev` + `bun run dev` and manually click through each phase's flows in the browser, for both a `pharmacy` and (Phase 0/5 especially) a `food` test tenant, before calling that phase done.
- Run `graphify update .` after each phase's code changes, per this repo's CLAUDE.md convention.

## Critical files
`apps/worker-api/src/middleware/tenant.ts`, `apps/worker-api/src/middleware/access.ts`, `apps/worker-api/src/routes/pos.ts`, `apps/worker-api/src/routes/approvals.ts`, `apps/worker-api/src/handlers/cron.ts`, `packages/shared/src/constants.ts`, `apps/app/src/layouts/DashboardLayout.vue`, `apps/app/src/stores/access.ts`.
