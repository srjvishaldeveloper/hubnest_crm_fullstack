-- 014: Subscription plans & usage enforcement

-- Subscription plans catalog
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50)   NOT NULL UNIQUE,
  slug        VARCHAR(50)   NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly  NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order  INTEGER       NOT NULL DEFAULT 0,
  features    JSONB         NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Per-resource limits for each plan (-1 = unlimited)
CREATE TABLE IF NOT EXISTS plan_limits (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id     UUID          NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  resource    VARCHAR(100)  NOT NULL,
  max_count   INTEGER       NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, resource)
);

-- Tenant subscriptions — which plan a tenant is on
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id         UUID          NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                    CONSTRAINT tenant_sub_status_check CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  billing_cycle   VARCHAR(20)   NOT NULL DEFAULT 'monthly'
                    CONSTRAINT tenant_sub_billing_check CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Usage tracking — current count per resource per tenant
CREATE TABLE IF NOT EXISTS usage_tracking (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource    VARCHAR(100)  NOT NULL,
  current_count INTEGER     NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, resource)
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug       ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active     ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_limits_plan_id           ON plan_limits(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_limits_resource          ON plan_limits(resource);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant   ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan     ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status   ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant         ON usage_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_resource       ON usage_tracking(resource);
