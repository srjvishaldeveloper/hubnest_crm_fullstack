-- 007: Sales executive module — tasks, activities, targets, and leads extensions

-- Alter leads_marketing to add sales executive fields
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'Warm' CHECK (priority IN ('Hot', 'Warm', 'Cold'));
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS next_followup TIMESTAMP;
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS conversion_probability INT DEFAULT 0 CHECK (conversion_probability >= 0 AND conversion_probability <= 100);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id      UUID         REFERENCES leads_marketing(id) ON DELETE SET NULL,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('Call', 'Meeting', 'Follow-up', 'Email')),
  title        VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  status       VARCHAR(20)  NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Done', 'Missed')),
  priority     VARCHAR(10)  NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id          UUID         REFERENCES leads_marketing(id) ON DELETE SET NULL,
  type             VARCHAR(20)  NOT NULL CHECK (type IN ('Call', 'Email', 'Meeting')),
  outcome          VARCHAR(50)  CHECK (outcome IN ('Connected', 'No Answer', 'Interested', 'Not Interested', 'Converted', 'Lost')),
  duration_seconds INT          DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Create sales_targets table
CREATE TABLE IF NOT EXISTS sales_targets (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month           INT            NOT NULL CHECK (month >= 1 AND month <= 12),
  year            INT            NOT NULL CHECK (year >= 2000),
  target_amount   DECIMAL(12,2)  DEFAULT 0,
  achieved_amount DECIMAL(12,2)  DEFAULT 0,
  target_leads    INT            DEFAULT 0,
  converted_leads INT            DEFAULT 0,
  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);

CREATE INDEX IF NOT EXISTS idx_sales_targets_user ON sales_targets(user_id, month, year);
