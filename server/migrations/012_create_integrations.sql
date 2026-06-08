-- Create integrations table to store config and credentials for third party APIs
CREATE TABLE IF NOT EXISTS integrations (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(50)   UNIQUE NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  description VARCHAR(255),
  status      VARCHAR(20)   NOT NULL DEFAULT 'disconnected',
  config      JSONB         NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Seed default platforms
INSERT INTO integrations (key, name, description, status, config) VALUES
('whatsapp_api', 'WhatsApp API', 'Business messaging via Meta Graph API', 'connected', '{"metaGraphToken": "EAAGxx...", "whatsappBusinessAccountId": "10987654321", "phoneNumberId": "1234567890"}'),
('email_service', 'Email Service', 'SMTP & Transactional email delivery', 'connected', '{"smtpHost": "smtp.gmail.com", "smtpPort": "587", "smtpUser": "srjchudamanideveloper@gmail.com"}'),
('sms_gateway', 'SMS Gateway', 'Twilio OTP & notifications gateway', 'warning', '{"twilioSid": "ACxxxx...", "twilioPhone": "+1234567890"}'),
('calling_api', 'Calling API', 'VoIP phone and call center integration', 'disconnected', '{}'),
('payment_gateway', 'Payment Gateway', 'Stripe & Razorpay payment processor', 'connected', '{"stripeSecret": "sk_test_..."}'),
('google_workspace', 'Google Workspace', 'Calendar sync & Drive documents storage', 'connected', '{"googleClientId": "xxxx.apps.googleusercontent.com"}')
ON CONFLICT (key) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;
