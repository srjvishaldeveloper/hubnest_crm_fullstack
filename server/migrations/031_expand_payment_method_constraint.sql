-- Expand payments method CHECK to include Debit Card, NEFT, RTGS, IMPS
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (method IN (
    'Bank Transfer', 'Credit Card', 'Debit Card', 'UPI',
    'Cash', 'Cheque', 'NEFT', 'RTGS', 'IMPS',
    'Stripe', 'Razorpay', 'Other'
  ));
