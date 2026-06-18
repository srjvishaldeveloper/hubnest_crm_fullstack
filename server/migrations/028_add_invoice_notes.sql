-- Add notes column to invoices for storing full GST invoice metadata as JSON
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
