-- Users table — both email and admin_id can be used to login
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id       UUID         NOT NULL REFERENCES roles(id),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  admin_id      VARCHAR(50)  UNIQUE,
  password_hash TEXT         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'Active'
                  CONSTRAINT users_status_check CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin_id  ON users(admin_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id   ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status    ON users(status);
