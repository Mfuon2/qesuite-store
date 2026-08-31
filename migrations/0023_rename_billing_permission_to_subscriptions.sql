-- The permission group formerly named "billing" (view/manage the store's own
-- QeSuite plan) is renamed to "subscriptions" so the "billing" namespace is
-- free for the new customer-invoicing feature. Renames any already-granted
-- permissions and pending staff invitations so no existing staff member's
-- access silently changes meaning.

UPDATE user_permissions SET permission_key = 'subscriptions.view' WHERE permission_key = 'billing.view';
UPDATE user_permissions SET permission_key = 'subscriptions.manage' WHERE permission_key = 'billing.manage';

UPDATE staff_invitations
SET permissions_json = REPLACE(REPLACE(permissions_json, '"billing.view"', '"subscriptions.view"'), '"billing.manage"', '"subscriptions.manage"')
WHERE permissions_json LIKE '%"billing.view"%' OR permissions_json LIKE '%"billing.manage"%';
