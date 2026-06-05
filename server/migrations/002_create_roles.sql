-- Roles table — permissions stored as JSONB for flexible RBAC
CREATE TABLE IF NOT EXISTS roles (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  permissions JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Example permissions shape:
-- {
--   "users":   { "create": true, "read": true, "update": true, "delete": false },
--   "jobs":    { "create": true, "read": true, "update": true, "delete": false },
--   "reports": { "create": false, "read": true, "update": false, "delete": false }
-- }

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
