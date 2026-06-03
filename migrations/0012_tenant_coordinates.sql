-- Add GPS coordinates to tenants so marketplace can show distance to customers
ALTER TABLE tenants ADD COLUMN lat REAL;
ALTER TABLE tenants ADD COLUMN lng REAL;
