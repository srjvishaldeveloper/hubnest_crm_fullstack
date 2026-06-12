-- 022: Campaign Builder — logs, template thumbnails, subscription type

-- Campaign execution logs
CREATE TABLE IF NOT EXISTS campaign_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES leads_marketing(id) ON DELETE SET NULL,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status       VARCHAR(30) NOT NULL DEFAULT 'queued', -- queued | sent | delivered | failed | bounced
  error        TEXT,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add thumbnail_url to marketing_templates if not present
ALTER TABLE marketing_templates
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS preview_text  TEXT;

-- Subscription type tracking per contact per channel
CREATE TABLE IF NOT EXISTS marketing_contact_subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id   UUID NOT NULL REFERENCES leads_marketing(id) ON DELETE CASCADE,
  channel      VARCHAR(30) NOT NULL DEFAULT 'email', -- email | sms | whatsapp
  sub_type     VARCHAR(30) NOT NULL DEFAULT 'marketing', -- marketing | non-marketing | unsubscribed
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, contact_id, channel)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign   ON campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_tenant     ON campaign_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status     ON campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_contact_subs_tenant      ON marketing_contact_subscriptions(tenant_id);
