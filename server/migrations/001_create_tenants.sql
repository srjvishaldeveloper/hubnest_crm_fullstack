-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table — one row per tenant organization
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  schema_name VARCHAR(100) NOT NULL UNIQUE,
  status      VARCHAR(20)  NOT NULL DEFAULT 'Active'
                CONSTRAINT tenants_status_check CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON tenants(schema_name);
CREATE INDEX IF NOT EXISTS idx_tenants_status       ON tenants(status);
