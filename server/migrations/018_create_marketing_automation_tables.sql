-- 018: Marketing Automation Platform Schema Extensions

CREATE TABLE IF NOT EXISTS marketing_contact_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_list_contacts (
  list_id    UUID NOT NULL REFERENCES marketing_contact_lists(id) ON DELETE CASCADE,
  lead_id    UUID NOT NULL REFERENCES leads_marketing(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, lead_id)
);

CREATE TABLE IF NOT EXISTS marketing_segments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  criteria    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_workflows (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  nodes          JSONB NOT NULL DEFAULT '[]',
  edges          JSONB NOT NULL DEFAULT '[]',
  status         VARCHAR(50) NOT NULL DEFAULT 'Draft',
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_workflow_runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id     UUID NOT NULL REFERENCES marketing_workflows(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads_marketing(id) ON DELETE CASCADE,
  current_node_id VARCHAR(100),
  status          VARCHAR(50) NOT NULL DEFAULT 'Running',
  execution_log   JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_forms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  fields      JSONB NOT NULL DEFAULT '[]',
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_form_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  form_id         UUID NOT NULL REFERENCES marketing_forms(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL DEFAULT '{}',
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_landing_pages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL,
  content       JSONB NOT NULL DEFAULT '{}',
  seo_settings  JSONB NOT NULL DEFAULT '{}',
  custom_domain VARCHAR(255),
  status        VARCHAR(50) NOT NULL DEFAULT 'Draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS marketing_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  type       VARCHAR(50) NOT NULL, -- email, whatsapp, sms, push, form, landing
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_media (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  file_name  VARCHAR(255) NOT NULL,
  file_url   TEXT NOT NULL,
  file_size  INTEGER,
  mime_type  VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads_marketing(id) ON DELETE CASCADE,
  channel         VARCHAR(50) NOT NULL, -- email, whatsapp, sms, push
  status          VARCHAR(50) NOT NULL DEFAULT 'Subscribed',
  unsubscribed_at TIMESTAMPTZ,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id, channel)
);

CREATE TABLE IF NOT EXISTS marketing_webhooks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  events     VARCHAR[] NOT NULL DEFAULT '{}',
  status     VARCHAR(50) NOT NULL DEFAULT 'Active',
  secret     VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS parent_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS channels VARCHAR[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT '{}';

-- Indices
CREATE INDEX IF NOT EXISTS idx_marketing_workflows_tenant ON marketing_workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_workflow_runs_lead ON marketing_workflow_runs(lead_id);
CREATE INDEX IF NOT EXISTS idx_marketing_forms_tenant ON marketing_forms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_landing_pages_tenant_slug ON marketing_landing_pages(tenant_id, slug);
