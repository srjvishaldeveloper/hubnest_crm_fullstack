-- 008: Sales Manager module — teams, team_members, lead_assignments, manager_targets, login_logs

-- ─── Extend leads_marketing ──────────────────────────────────────────────────
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE leads_marketing ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;

-- ─── Teams ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  manager_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ─── Team Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id       UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ─── Lead Assignment History ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_assignments (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id         UUID        NOT NULL REFERENCES leads_marketing(id) ON DELETE CASCADE,
  assigned_to     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_from   UUID        REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Manager Targets ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manager_targets (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  manager_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month           INT            NOT NULL CHECK (month >= 1 AND month <= 12),
  year            INT            NOT NULL CHECK (year >= 2000),
  revenue_target  DECIMAL(14,2)  DEFAULT 0,
  revenue_achieved DECIMAL(14,2) DEFAULT 0,
  leads_target    INT            DEFAULT 0,
  leads_converted INT            DEFAULT 0,
  team_target     INT            DEFAULT 0,
  UNIQUE(manager_id, month, year)
);

-- ─── Login Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  email       VARCHAR(255),
  ip_address  VARCHAR(64),
  user_agent  TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RBAC: Upsert Sales Manager Role ─────────────────────────────────────────
DO $$
DECLARE
  sm_permissions JSONB := '{
    "leads":      {"create": true,  "read": true, "update": true,  "delete": false},
    "tasks":      {"create": true,  "read": true, "update": true,  "delete": true},
    "activities": {"create": true,  "read": true, "update": true,  "delete": false},
    "reports":    {"create": false, "read": true, "update": false, "delete": false},
    "team":       {"create": true,  "read": true, "update": true,  "delete": false},
    "users":      {"create": true,  "read": true, "update": true,  "delete": false}
  }'::JSONB;
BEGIN
  INSERT INTO roles (name, permissions)
  VALUES ('Sales Manager', sm_permissions)
  ON CONFLICT (name) DO UPDATE SET permissions = sm_permissions;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id    ON teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id   ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team  ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user  ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_assign_lead   ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assign_tenant ON lead_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manager_targets    ON manager_targets(manager_id, month, year);
CREATE INDEX IF NOT EXISTS idx_login_logs_user    ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_tenant  ON login_logs(tenant_id);
