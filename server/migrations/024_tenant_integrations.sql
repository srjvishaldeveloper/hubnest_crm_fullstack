-- Per-tenant integration credentials (encrypted at application level)
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider     VARCHAR(50) NOT NULL,               -- e.g. 'whatsapp', 'meta-ads', 'slack'
  credentials  JSONB       NOT NULL DEFAULT '{}',  -- stored as plain JSONB; encrypt at app layer if needed
  enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  connected_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
