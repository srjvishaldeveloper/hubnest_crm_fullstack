-- Alter users status check constraint to support 'Archived' status
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Archived'));
