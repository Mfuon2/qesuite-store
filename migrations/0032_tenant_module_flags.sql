-- Lets a superadmin control which dashboard modules are visible (and, where the
-- module's routes are cleanly dashboard-only, reachable) for a given store owner
-- — independent of that owner's own staff permission grants, which control who
-- on their team sees a module they DO have.
--
-- Stored as a disabled-list, not an enabled-list, so any module added in the
-- future stays visible by default until a superadmin explicitly turns it off —
-- matching today's behavior for every existing tenant with zero migration-time
-- disruption.
ALTER TABLE tenants ADD COLUMN disabled_modules TEXT NOT NULL DEFAULT '[]';
