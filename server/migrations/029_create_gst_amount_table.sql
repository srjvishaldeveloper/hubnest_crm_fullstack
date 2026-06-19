-- Create gst_amount table to keep track of GST values
CREATE TABLE IF NOT EXISTS gst_amount (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
