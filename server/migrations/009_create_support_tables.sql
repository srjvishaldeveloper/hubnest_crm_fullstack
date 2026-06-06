-- 009: Support Module — customers, support_tickets, support_ticket_messages, knowledge_base_articles, knowledge_base_comments

-- ─── Customers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  company     VARCHAR(255),
  status      VARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ─── Support Tickets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         UUID         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_agent_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
  title               VARCHAR(255) NOT NULL,
  description         TEXT         NOT NULL,
  category            VARCHAR(50)  NOT NULL CHECK (category IN ('Technical', 'Billing', 'General')),
  priority            VARCHAR(20)  NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status              VARCHAR(20)  NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  sla_deadline        TIMESTAMPTZ  NOT NULL,
  satisfaction_rating INT          CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Support Ticket Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id        UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type      VARCHAR(20) NOT NULL CHECK (sender_type IN ('Agent', 'Customer')),
  sender_id        UUID        NOT NULL, -- user_id if Agent, customer_id if Customer
  message          TEXT        NOT NULL,
  is_internal_note BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Knowledge Base Articles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  content        TEXT         NOT NULL,
  category       VARCHAR(100) NOT NULL, -- Technical Issues, Billing, Account Help, General FAQs
  status         VARCHAR(20)  NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  views_count    INT          NOT NULL DEFAULT 0,
  likes_count    INT          NOT NULL DEFAULT 0,
  dislikes_count INT          NOT NULL DEFAULT 0,
  created_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Knowledge Base Comments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base_comments (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID        NOT NULL REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  is_like    BOOLEAN     NOT NULL, -- true for like, false for dislike
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RBAC: Seed Support Roles ─────────────────────────────────────────────────
DO $$
DECLARE
  sa_permissions JSONB := '{
    "tickets":        {"create": true, "read": true, "update": true, "delete": false},
    "customers":      {"create": true, "read": true, "update": true, "delete": false},
    "knowledge_base": {"create": true, "read": true, "update": true, "delete": false},
    "profile":        {"create": true, "read": true, "update": true, "delete": false}
  }'::JSONB;
  sm_permissions JSONB := '{
    "tickets":        {"create": true, "read": true, "update": true, "delete": true},
    "customers":      {"create": true, "read": true, "update": true, "delete": true},
    "knowledge_base": {"create": true, "read": true, "update": true, "delete": true},
    "profile":        {"create": true, "read": true, "update": true, "delete": true}
  }'::JSONB;
BEGIN
  INSERT INTO roles (name, permissions)
  VALUES ('Support Agent', sa_permissions)
  ON CONFLICT (name) DO UPDATE SET permissions = sa_permissions;

  INSERT INTO roles (name, permissions)
  VALUES ('Support Manager', sm_permissions)
  ON CONFLICT (name) DO UPDATE SET permissions = sm_permissions;
END $$;

-- ─── Seed Initial Mock Data ───────────────────────────────────────────────────
DO $$
DECLARE
  first_tenant_id UUID;
  first_user_id   UUID;
  cust_id_1       UUID := uuid_generate_v4();
  cust_id_2       UUID := uuid_generate_v4();
  cust_id_3       UUID := uuid_generate_v4();
  ticket_id_1     UUID := uuid_generate_v4();
  ticket_id_2     UUID := uuid_generate_v4();
  kb_id_1         UUID := uuid_generate_v4();
  kb_id_2         UUID := uuid_generate_v4();
BEGIN
  -- Get first active tenant and user to link seeded support items
  SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
  SELECT id INTO first_user_id FROM users WHERE tenant_id = first_tenant_id LIMIT 1;

  -- Only seed when no customer rows exist yet for this tenant (safe on re-runs)
  IF first_tenant_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM customers WHERE tenant_id = first_tenant_id LIMIT 1
  ) THEN
    -- Seed Customers
    INSERT INTO customers (id, tenant_id, name, email, phone, company, status)
    VALUES 
      (cust_id_1, first_tenant_id, 'Rohit Sharma', 'rohit.sharma@gmail.com', '+91 98765 43210', 'Mumbai Indians Corp', 'Active'),
      (cust_id_2, first_tenant_id, 'Neha Patel', 'neha.patel@gmail.com', '+91 98123 45678', 'Ahmedabad Textiles', 'Active'),
      (cust_id_3, first_tenant_id, 'Amit Verma', 'amit.verma@gmail.com', '+91 99999 88888', 'Delhi Logistics', 'Active')
    ON CONFLICT DO NOTHING;

    -- Seed Tickets
    INSERT INTO support_tickets (id, tenant_id, customer_id, assigned_agent_id, title, description, category, priority, status, sla_deadline, satisfaction_rating, satisfaction_feedback)
    VALUES
      (ticket_id_1, first_tenant_id, cust_id_1, first_user_id, 'Unable to login to account', 'Getting error message "Invalid credentials" when trying to sign in.', 'Technical', 'High', 'Open', NOW() + INTERVAL '4 hours', NULL, NULL),
      (ticket_id_2, first_tenant_id, cust_id_2, first_user_id, 'Payment not processed', 'My subscription payment went through but status is still pending.', 'Billing', 'High', 'In Progress', NOW() + INTERVAL '24 hours', NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- Seed Messages
    INSERT INTO support_ticket_messages (id, ticket_id, sender_type, sender_id, message, is_internal_note)
    VALUES
      (uuid_generate_v4(), ticket_id_1, 'Customer', cust_id_1, 'I am unable to login to my account. It shows invalid credentials.', FALSE),
      (uuid_generate_v4(), ticket_id_1, 'Agent', first_user_id, 'Hello Rohit, I am sorry you are facing this issue. Can you please confirm your registered email?', FALSE),
      (uuid_generate_v4(), ticket_id_1, 'Agent', first_user_id, 'Checking auth logs: user password was recently changed.', TRUE)
    ON CONFLICT DO NOTHING;

    -- Seed KB Articles
    INSERT INTO knowledge_base_articles (id, tenant_id, title, content, category, status, views_count, likes_count, dislikes_count, created_by)
    VALUES
      (kb_id_1, first_tenant_id, 'How to reset password?', 'To reset your password, click on the Forgot Password link on the login page and enter your registered email. You will receive an OTP code to verify and set a new password.', 'Account Help', 'Published', 2345, 12, 1, first_user_id),
      (kb_id_2, first_tenant_id, 'How to update billing info?', 'Go to Profile settings, then select Billing section. Click on Update Card, enter your new details, and save the changes.', 'Billing', 'Published', 1876, 8, 0, first_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id    ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status       ON customers(status);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id      ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id    ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id       ON support_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status         ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs_ticket_id  ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tenant_id  ON knowledge_base_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category   ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status     ON knowledge_base_articles(status);
