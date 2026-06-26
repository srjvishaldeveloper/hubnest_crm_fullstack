-- User documents table for profile document uploads
CREATE TABLE IF NOT EXISTS user_documents (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NOT NULL DEFAULT 'Other',
  file_url    TEXT         NOT NULL,
  file_size   VARCHAR(50)  DEFAULT '0 KB',
  mime_type   VARCHAR(100),
  status      VARCHAR(20)  NOT NULL DEFAULT 'Pending'
                CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id   ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_tenant_id ON user_documents(tenant_id);

-- Add address column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
