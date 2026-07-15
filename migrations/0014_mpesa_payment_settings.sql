-- Per-store M-Pesa receiving details for manual (customer-entered code) payments.
-- mpesa_payment_type: 'till' | 'paybill' | 'send_money'
-- mpesa_payment_number: till number, paybill number, or phone for send-money
-- mpesa_account_ref: account number shown to the customer for paybill payments
ALTER TABLE store_settings ADD COLUMN mpesa_payment_type TEXT;
ALTER TABLE store_settings ADD COLUMN mpesa_payment_number TEXT;
ALTER TABLE store_settings ADD COLUMN mpesa_account_ref TEXT;
