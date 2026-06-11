-- Seed subscription plans and their limits
-- Uses ON CONFLICT to be safely re-runnable (idempotent)

-- ============================================================
-- 1. Insert subscription plans
-- ============================================================
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, is_active, sort_order, features)
VALUES
  (
    'Starter',
    'starter',
    'Perfect for small teams getting started with CRM',
    29.00,
    290.00,
    TRUE,
    1,
    '["Basic CRM features", "Email support", "Basic reports", "Up to 2 departments", "Up to 5 team members"]'::jsonb
  ),
  (
    'Pro',
    'pro',
    'For growing teams that need advanced capabilities',
    79.00,
    790.00,
    TRUE,
    2,
    '["Advanced CRM features", "Priority support", "Advanced reports", "Up to 10 departments", "Up to 50 team members", "Unlimited campaigns"]'::jsonb
  ),
  (
    'Enterprise',
    'enterprise',
    'Full-featured solution for large organizations',
    199.00,
    1990.00,
    TRUE,
    3,
    '["All CRM features", "Dedicated support", "Custom reports", "Unlimited everything", "White label", "API access", "Audit logs"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  description   = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly  = EXCLUDED.price_yearly,
  is_active     = EXCLUDED.is_active,
  sort_order    = EXCLUDED.sort_order,
  features      = EXCLUDED.features,
  updated_at    = NOW();

-- ============================================================
-- 2. Insert plan limits (-1 = unlimited)
-- ============================================================

-- STARTER plan limits
INSERT INTO plan_limits (plan_id, resource, max_count)
VALUES
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'departments',  2),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'team_members', 5),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'leads',        3000),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'contacts',     500),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'pipelines',    2),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'campaigns',    1),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'reports',      0),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'white_label',  0),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'api_access',   0),
  ((SELECT id FROM subscription_plans WHERE slug = 'starter'), 'audit_logs',   0)
ON CONFLICT (plan_id, resource) DO UPDATE SET max_count = EXCLUDED.max_count;

-- PRO plan limits
INSERT INTO plan_limits (plan_id, resource, max_count)
VALUES
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'departments',  10),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'team_members', 50),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'leads',        25000),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'contacts',     5000),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'pipelines',    20),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'campaigns',    -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'reports',      1),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'white_label',  0),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'api_access',   0),
  ((SELECT id FROM subscription_plans WHERE slug = 'pro'), 'audit_logs',   0)
ON CONFLICT (plan_id, resource) DO UPDATE SET max_count = EXCLUDED.max_count;

-- ENTERPRISE plan limits (all unlimited = -1)
INSERT INTO plan_limits (plan_id, resource, max_count)
VALUES
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'departments',  -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'team_members', -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'leads',        -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'contacts',     -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'pipelines',    -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'campaigns',    -1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'reports',      1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'white_label',  1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'api_access',   1),
  ((SELECT id FROM subscription_plans WHERE slug = 'enterprise'), 'audit_logs',   1)
ON CONFLICT (plan_id, resource) DO UPDATE SET max_count = EXCLUDED.max_count;
