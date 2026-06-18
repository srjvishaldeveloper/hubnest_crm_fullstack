-- Credit Notes / Debit Notes for paid invoice returns
CREATE TABLE IF NOT EXISTS credit_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  note_number VARCHAR(50) NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'Credit Note' CHECK (type IN ('Credit Note', 'Debit Note')),
  reason      TEXT,
  items       JSONB,
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Settled', 'Cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant    ON credit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice   ON credit_notes(invoice_id);
