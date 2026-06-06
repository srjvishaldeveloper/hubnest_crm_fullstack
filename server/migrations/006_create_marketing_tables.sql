-- 006: Marketing module — campaigns, leads, analytics
CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(255)  NOT NULL,
  type            VARCHAR(100),
  platform        VARCHAR(100),
  budget_daily    NUMERIC(12,2) DEFAULT 0,
  budget_total    NUMERIC(12,2) DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  status          VARCHAR(50)   NOT NULL DEFAULT 'Draft',
  target_audience JSONB         NOT NULL DEFAULT '{}',
  content         JSONB         NOT NULL DEFAULT '{}',
  created_by      UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_marketing (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id   UUID         REFERENCES campaigns(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  source        VARCHAR(100),
  platform      VARCHAR(100),
  status        VARCHAR(50)  NOT NULL DEFAULT 'New',
  quality_score INTEGER      NOT NULL DEFAULT 0,
  assigned_to   UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_analytics (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID          NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date         DATE          NOT NULL,
  impressions  INTEGER       NOT NULL DEFAULT 0,
  clicks       INTEGER       NOT NULL DEFAULT 0,
  leads        INTEGER       NOT NULL DEFAULT 0,
  cost         NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id       ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status          ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_leads_mktg_tenant_id      ON leads_marketing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_mktg_campaign_id    ON leads_marketing(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_analytics_campaign   ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_analytics_date       ON campaign_analytics(date);
