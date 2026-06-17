-- Drop the existing payments_method_check constraint if it exists and recreate it to include Stripe and Razorpay
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('Bank Transfer', 'Credit Card', 'UPI', 'Cash', 'Cheque', 'Other', 'Stripe', 'Razorpay'));
