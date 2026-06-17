-- 015: Finance Module — invoices, payments, expenses, vendors, payroll, tax_records

-- ─── Vendors ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(50),
  address     TEXT,
  category    VARCHAR(100) NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'Technology', 'Services', 'Supplies', 'Consulting', 'Other')),
  status      VARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Invoices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(50)    NOT NULL,
  customer_name   VARCHAR(255)   NOT NULL,
  amount          DECIMAL(12,2)  NOT NULL DEFAULT 0,
  tax             DECIMAL(12,2)  NOT NULL DEFAULT 0,
  total           DECIMAL(12,2)  NOT NULL DEFAULT 0,
  status          VARCHAR(20)    NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
  due_date        DATE           NOT NULL,
  paid_date       DATE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_number)
);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id  UUID           REFERENCES invoices(id) ON DELETE SET NULL,
  amount      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  method      VARCHAR(50)    NOT NULL DEFAULT 'Bank Transfer' CHECK (method IN ('Bank Transfer', 'Credit Card', 'UPI', 'Cash', 'Cheque', 'Other', 'Stripe', 'Razorpay')),
  reference   VARCHAR(255),
  status      VARCHAR(20)    NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
  paid_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Expenses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category     VARCHAR(100)   NOT NULL DEFAULT 'General' CHECK (category IN ('Salaries', 'Rent', 'Utilities', 'Marketing', 'Travel', 'Software', 'Hardware', 'General', 'Other', 'Supplies', 'Consulting')),
  description  TEXT           NOT NULL,
  amount       DECIMAL(12,2)  NOT NULL DEFAULT 0,
  vendor_id    UUID           REFERENCES vendors(id) ON DELETE SET NULL,
  approved_by  UUID           REFERENCES users(id) ON DELETE SET NULL,
  status       VARCHAR(20)    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Reimbursed')),
  expense_date DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Payroll ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID           REFERENCES users(id) ON DELETE SET NULL,
  salary      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  bonus       DECIMAL(12,2)  NOT NULL DEFAULT 0,
  deductions  DECIMAL(12,2)  NOT NULL DEFAULT 0,
  net_pay     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  pay_period  VARCHAR(20)    NOT NULL CHECK (pay_period IN ('Monthly', 'Bi-Weekly', 'Weekly')),
  status      VARCHAR(20)    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Paid', 'Failed')),
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Tax Records ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_records (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tax_type    VARCHAR(50)    NOT NULL CHECK (tax_type IN ('GST', 'Income Tax', 'TDS', 'Professional Tax', 'Other')),
  amount      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  period      VARCHAR(20)    NOT NULL,
  status      VARCHAR(20)    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Filed', 'Paid', 'Overdue')),
  filed_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── RBAC: Seed Finance Roles ────────────────────────────────────────────────
DO $$
DECLARE
  fm_permissions JSONB := '{
    "invoices":    {"create": true, "read": true, "update": true, "delete": true},
    "payments":    {"create": true, "read": true, "update": true, "delete": true},
    "expenses":    {"create": true, "read": true, "update": true, "delete": true},
    "vendors":     {"create": true, "read": true, "update": true, "delete": true},
    "payroll":     {"create": true, "read": true, "update": true, "delete": true},
    "tax_records": {"create": true, "read": true, "update": true, "delete": true},
    "profile":     {"create": true, "read": true, "update": true, "delete": false}
  }'::JSONB;
  ac_permissions JSONB := '{
    "invoices":    {"create": true, "read": true, "update": true, "delete": false},
    "payments":    {"create": true, "read": true, "update": true, "delete": false},
    "expenses":    {"create": true, "read": true, "update": true, "delete": false},
    "vendors":     {"create": true, "read": true, "update": false, "delete": false},
    "payroll":     {"create": false, "read": true, "update": false, "delete": false},
    "tax_records": {"create": true, "read": true, "update": true, "delete": false},
    "profile":     {"create": true, "read": true, "update": true, "delete": false}
  }'::JSONB;
  au_permissions JSONB := '{
    "invoices":    {"create": false, "read": true, "update": false, "delete": false},
    "payments":    {"create": false, "read": true, "update": false, "delete": false},
    "expenses":    {"create": false, "read": true, "update": false, "delete": false},
    "vendors":     {"create": false, "read": true, "update": false, "delete": false},
    "payroll":     {"create": false, "read": true, "update": false, "delete": false},
    "tax_records": {"create": false, "read": true, "update": false, "delete": false},
    "profile":     {"create": true, "read": true, "update": true, "delete": false}
  }'::JSONB;
BEGIN
  INSERT INTO roles (name, permissions)
  VALUES ('Finance Manager', fm_permissions)
  ON CONFLICT (name) DO UPDATE SET permissions = fm_permissions;

  INSERT INTO roles (name, permissions)
  VALUES ('Accountant', ac_permissions)
  ON CONFLICT (name) DO UPDATE SET permissions = ac_permissions;

  INSERT INTO roles (name, permissions)
  VALUES ('Auditor', au_permissions)
  ON CONFLICT (name) DO UPDATE SET permissions = au_permissions;
END $$;

-- ─── Seed Initial Finance Data ──────────────────────────────────────────────
DO $$
DECLARE
  first_tenant_id UUID;
  first_user_id   UUID;
  vendor_id_1     UUID := uuid_generate_v4();
  vendor_id_2     UUID := uuid_generate_v4();
  vendor_id_3     UUID := uuid_generate_v4();
  inv_id_1        UUID := uuid_generate_v4();
  inv_id_2        UUID := uuid_generate_v4();
  inv_id_3        UUID := uuid_generate_v4();
  inv_id_4        UUID := uuid_generate_v4();
  inv_id_5        UUID := uuid_generate_v4();
BEGIN
  SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
  SELECT id INTO first_user_id FROM users WHERE tenant_id = first_tenant_id LIMIT 1;

  IF first_tenant_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM vendors WHERE tenant_id = first_tenant_id LIMIT 1
  ) THEN
    -- Seed Vendors
    INSERT INTO vendors (id, tenant_id, name, email, phone, address, category, status)
    VALUES
      (vendor_id_1, first_tenant_id, 'CloudTech Solutions', 'billing@cloudtech.in', '+91 98765 11111', '42 MG Road, Bangalore 560001', 'Technology', 'Active'),
      (vendor_id_2, first_tenant_id, 'Office Supplies Co.', 'orders@officesupplies.in', '+91 98765 22222', '15 Connaught Place, New Delhi 110001', 'Supplies', 'Active'),
      (vendor_id_3, first_tenant_id, 'Rajesh & Associates', 'contact@rajeshassoc.in', '+91 98765 33333', '88 FC Road, Pune 411004', 'Consulting', 'Active')
    ON CONFLICT DO NOTHING;

    -- Seed Invoices
    INSERT INTO invoices (id, tenant_id, invoice_number, customer_name, amount, tax, total, status, due_date, paid_date)
    VALUES
      (inv_id_1, first_tenant_id, 'INV-2026-001', 'Mumbai Indians Corp', 150000.00, 27000.00, 177000.00, 'Paid', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days'),
      (inv_id_2, first_tenant_id, 'INV-2026-002', 'Ahmedabad Textiles', 85000.00, 15300.00, 100300.00, 'Sent', CURRENT_DATE + INTERVAL '15 days', NULL),
      (inv_id_3, first_tenant_id, 'INV-2026-003', 'Delhi Logistics', 220000.00, 39600.00, 259600.00, 'Overdue', CURRENT_DATE - INTERVAL '5 days', NULL),
      (inv_id_4, first_tenant_id, 'INV-2026-004', 'TechVista Solutions', 45000.00, 8100.00, 53100.00, 'Paid', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '18 days'),
      (inv_id_5, first_tenant_id, 'INV-2026-005', 'Green Energy Ltd', 320000.00, 57600.00, 377600.00, 'Draft', CURRENT_DATE + INTERVAL '30 days', NULL)
    ON CONFLICT DO NOTHING;

    -- Seed Payments
    INSERT INTO payments (tenant_id, invoice_id, amount, method, reference, status, paid_at)
    VALUES
      (first_tenant_id, inv_id_1, 177000.00, 'Bank Transfer', 'NEFT-REF-20260528-001', 'Completed', CURRENT_DATE - INTERVAL '5 days'),
      (first_tenant_id, inv_id_4, 53100.00, 'UPI', 'UPI-REF-20260520-002', 'Completed', CURRENT_DATE - INTERVAL '18 days'),
      (first_tenant_id, NULL, 25000.00, 'Cash', 'CASH-ADV-001', 'Completed', CURRENT_DATE - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- Seed Expenses
    INSERT INTO expenses (tenant_id, category, description, amount, vendor_id, approved_by, status, expense_date)
    VALUES
      (first_tenant_id, 'Software', 'Annual cloud hosting subscription', 120000.00, vendor_id_1, first_user_id, 'Approved', CURRENT_DATE - INTERVAL '15 days'),
      (first_tenant_id, 'Supplies', 'Office stationery and furniture', 35000.00, vendor_id_2, first_user_id, 'Approved', CURRENT_DATE - INTERVAL '10 days'),
      (first_tenant_id, 'Consulting', 'Tax consulting for Q1 FY2026', 50000.00, vendor_id_3, NULL, 'Pending', CURRENT_DATE - INTERVAL '3 days'),
      (first_tenant_id, 'Travel', 'Client visit travel expenses', 18000.00, NULL, NULL, 'Pending', CURRENT_DATE - INTERVAL '1 day'),
      (first_tenant_id, 'Marketing', 'Google Ads campaign budget', 75000.00, NULL, first_user_id, 'Approved', CURRENT_DATE - INTERVAL '7 days'),
      (first_tenant_id, 'Salaries', 'Monthly payroll for June 2026', 850000.00, NULL, first_user_id, 'Approved', CURRENT_DATE - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- Seed Payroll
    INSERT INTO payroll (tenant_id, employee_id, salary, bonus, deductions, net_pay, pay_period, status, paid_at)
    VALUES
      (first_tenant_id, first_user_id, 75000.00, 5000.00, 8500.00, 71500.00, 'Monthly', 'Paid', CURRENT_DATE - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- Seed Tax Records
    INSERT INTO tax_records (tenant_id, tax_type, amount, period, status, filed_at)
    VALUES
      (first_tenant_id, 'GST', 147600.00, 'Q1-2026', 'Filed', CURRENT_DATE - INTERVAL '20 days'),
      (first_tenant_id, 'TDS', 42500.00, 'Q1-2026', 'Paid', CURRENT_DATE - INTERVAL '15 days'),
      (first_tenant_id, 'Income Tax', 285000.00, 'FY-2026', 'Pending', NULL),
      (first_tenant_id, 'Professional Tax', 2500.00, 'June-2026', 'Filed', CURRENT_DATE - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id     ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status        ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id    ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status       ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date     ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id    ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id   ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON payments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id    ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status       ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category     ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_payroll_tenant_id     ON payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id   ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status        ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_tax_records_tenant_id ON tax_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_records_status    ON tax_records(status);
