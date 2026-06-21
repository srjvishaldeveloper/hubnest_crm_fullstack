-- 030: Super Admin persistent tables (replaces in-memory arrays)

CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage','flat')),
  expires_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_name VARCHAR(200),
  current_plan VARCHAR(100),
  requested_plan VARCHAR(100),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipients VARCHAR(100) NOT NULL DEFAULT 'All Users',
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  key_prefix VARCHAR(50) NOT NULL,
  key_hash VARCHAR(255),
  permissions VARCHAR(100) NOT NULL DEFAULT 'Read/Write',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL DEFAULT '*',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  reporter VARCHAR(200),
  severity VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low','Medium','High','Critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved','Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  location VARCHAR(200),
  type VARCHAR(50) DEFAULT 'Full-time',
  description TEXT,
  requirements TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Closed','Draft')),
  applications_count INTEGER NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default coupons if table is empty
INSERT INTO discount_coupons (code, discount_percent, type, expires_at, usage_count, max_usage, status)
VALUES
  ('WELCOME20', 20, 'percentage', '2026-12-31 00:00:00+00', 4, 100, 'active'),
  ('SUPER50', 50, 'flat', '2026-07-15 00:00:00+00', 12, 250, 'active')
ON CONFLICT (code) DO NOTHING;

-- Seed default api key if table is empty
INSERT INTO platform_api_keys (name, key_prefix, permissions, status, last_used_at)
SELECT 'Production Key', 'hn_live_9a8f...', 'Read/Write', 'active', NOW()
WHERE NOT EXISTS (SELECT 1 FROM platform_api_keys LIMIT 1);

-- Seed default career if table is empty
INSERT INTO platform_careers (title, department, location, type, description, requirements, salary_min, salary_max, status, applications_count)
SELECT 'Senior NodeJS Engineer', 'Engineering', 'Remote', 'Full-time', 'Maintain scale core microservices.', 'NodeJS, PostgreSQL, Redis', 1200000, 1800000, 'Active', 8
WHERE NOT EXISTS (SELECT 1 FROM platform_careers LIMIT 1);
