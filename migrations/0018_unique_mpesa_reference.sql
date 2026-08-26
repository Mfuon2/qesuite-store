-- An M-Pesa transaction code is a unique proof of payment and must not be
-- submitted by more than one store or reused for another billing cycle.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_history_mpesa_reference
ON billing_history(reference COLLATE NOCASE)
WHERE payment_method = 'mpesa'
  AND reference IS NOT NULL
  AND trim(reference) <> '';
