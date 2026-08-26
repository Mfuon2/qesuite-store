-- Backfill existing phone numbers to the canonical wire format (254XXXXXXXXX,
-- no plus) that normalizeKenyaPhone() now enforces at write time. Without
-- this, rows written before that fix keep their original raw format and a
-- normalized login/lookup attempt against them silently fails to match.
--
-- Scoped to columns that participate in login/lookup matching (users.phone,
-- tenants.phone/whatsapp_number, delivery_staff.phone, subscriptions.mpesa_phone).
-- Deliberately excludes customers.phone (UNIQUE(tenant_id, phone) — two
-- differently-formatted rows for the same number could collide once
-- normalized, which needs a manual dedupe pass, not a blind backfill) and
-- orders.customer_phone (not a login credential; already compared via
-- normalizeKenyaPhone() at read time in storefront.ts, so raw historical
-- storage there is already tolerated).
--
-- Mirrors normalizeKenyaPhone()'s JS logic: strip formatting characters,
-- then if it doesn't already start with 254, strip one leading zero (if
-- present) and prepend 254.

UPDATE tenants SET phone =
  CASE
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '254%'
      THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '0%'
      THEN '254' || substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+',''), 2)
    ELSE '254' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')
  END
WHERE phone IS NOT NULL AND phone != '';

UPDATE tenants SET whatsapp_number =
  CASE
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp_number,' ',''),'-',''),'(',''),')',''),'+','') LIKE '254%'
      THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp_number,' ',''),'-',''),'(',''),')',''),'+','')
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp_number,' ',''),'-',''),'(',''),')',''),'+','') LIKE '0%'
      THEN '254' || substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp_number,' ',''),'-',''),'(',''),')',''),'+',''), 2)
    ELSE '254' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp_number,' ',''),'-',''),'(',''),')',''),'+','')
  END
WHERE whatsapp_number IS NOT NULL AND whatsapp_number != '';

UPDATE users SET phone =
  CASE
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '254%'
      THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '0%'
      THEN '254' || substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+',''), 2)
    ELSE '254' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')
  END
WHERE phone IS NOT NULL AND phone != '';

UPDATE delivery_staff SET phone =
  CASE
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '254%'
      THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '0%'
      THEN '254' || substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+',''), 2)
    ELSE '254' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')
  END
WHERE phone IS NOT NULL AND phone != '';

UPDATE subscriptions SET mpesa_phone =
  CASE
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mpesa_phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '254%'
      THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mpesa_phone,' ',''),'-',''),'(',''),')',''),'+','')
    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mpesa_phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE '0%'
      THEN '254' || substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mpesa_phone,' ',''),'-',''),'(',''),')',''),'+',''), 2)
    ELSE '254' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mpesa_phone,' ',''),'-',''),'(',''),')',''),'+','')
  END
WHERE mpesa_phone IS NOT NULL AND mpesa_phone != '';
