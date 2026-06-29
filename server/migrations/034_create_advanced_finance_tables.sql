-- 034: Advanced Finance Tables - Budgets and Compliance Tracking

-- ─── Budgets ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department  VARCHAR(100)   NOT NULL,
  allocated   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  used        DECIMAL(12,2)  NOT NULL DEFAULT 0,
  period      VARCHAR(20)    NOT NULL, -- e.g. "Q1-2026", "Monthly"
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, department, period)
);

-- ─── Statutory Compliance ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS statutory_compliance (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           VARCHAR(255)   NOT NULL,
  authority       VARCHAR(255)   NOT NULL,
  status          VARCHAR(20)    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Compliant', 'Non-Compliant')),
  last_filed_date DATE,
  next_due_date   DATE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Compliance Deadlines ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_deadlines (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       VARCHAR(255)   NOT NULL,
  due_date    DATE           NOT NULL,
  severity    VARCHAR(20)    NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  type        VARCHAR(50)    NOT NULL, -- e.g., "Tax", "Audit"
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Finance Risk Items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_risk_items (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description TEXT           NOT NULL,
  impact      VARCHAR(20)    NOT NULL CHECK (impact IN ('Low', 'Medium', 'High', 'Critical')),
  status      VARCHAR(20)    NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Mitigated', 'Closed')),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Seed Data ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  first_tenant_id UUID;
BEGIN
  SELECT id INTO first_tenant_id FROM tenants LIMIT 1;

  IF first_tenant_id IS NOT NULL THEN
    -- Seed Budgets
    INSERT INTO budgets (tenant_id, department, allocated, used, period)
    VALUES
      (first_tenant_id, 'Marketing', 250000.00, 120000.00, 'Q1-2026'),
      (first_tenant_id, 'Technology', 500000.00, 420000.00, 'Q1-2026'),
      (first_tenant_id, 'Operations', 300000.00, 280000.00, 'Q1-2026'),
      (first_tenant_id, 'Sales', 150000.00, 60000.00, 'Q1-2026')
    ON CONFLICT DO NOTHING;

    -- Seed Statutory Compliance
    INSERT INTO statutory_compliance (tenant_id, title, authority, status, last_filed_date, next_due_date)
    VALUES
      (first_tenant_id, 'Company Annual Return', 'MCA', 'Compliant', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '355 days'),
      (first_tenant_id, 'Provident Fund (PF)', 'EPFO', 'Pending', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '5 days'),
      (first_tenant_id, 'Employee State Insurance', 'ESIC', 'Non-Compliant', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '15 days')
    ON CONFLICT DO NOTHING;

    -- Seed Compliance Deadlines
    INSERT INTO compliance_deadlines (tenant_id, title, due_date, severity, type)
    VALUES
      (first_tenant_id, 'Q1 Advance Tax Payment', CURRENT_DATE + INTERVAL '5 days', 'Critical', 'Tax'),
      (first_tenant_id, 'Annual ISO Audit', CURRENT_DATE + INTERVAL '20 days', 'High', 'Audit'),
      (first_tenant_id, 'Vendor TDS Return', CURRENT_DATE + INTERVAL '2 days', 'High', 'Tax')
    ON CONFLICT DO NOTHING;

    -- Seed Risk Items
    INSERT INTO finance_risk_items (tenant_id, description, impact, status)
    VALUES
      (first_tenant_id, 'High dependency on a single payment gateway (Stripe) could cause disruption if account faces issues.', 'Medium', 'Open'),
      (first_tenant_id, 'Pending GST notices for FY2024 regarding input tax credit mismatch.', 'High', 'Open'),
      (first_tenant_id, 'Marketing budget overshoot projected by 15% this quarter based on current spending rate.', 'Medium', 'Open')
    ON CONFLICT DO NOTHING;

  END IF;
END $$;
