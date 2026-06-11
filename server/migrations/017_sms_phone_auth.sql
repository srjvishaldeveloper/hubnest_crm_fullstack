-- Migration 017: SMS Authentication & Phone Fields
-- Adds phone_number, SMS preferences, and SMS logs table

-- 1. Add phone/SMS columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country_code       VARCHAR(5)   DEFAULT '+91',
  ADD COLUMN IF NOT EXISTS phone_verified     BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_login_method VARCHAR(10) DEFAULT 'email' CHECK (preferred_login_method IN ('email', 'phone', 'both')),
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_sms_sent_at   TIMESTAMPTZ;

-- 2. Indexes for phone-based lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number   ON users (phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users (phone_verified) WHERE phone_verified = TRUE;

-- 3. SMS logs table for delivery tracking and audit
CREATE TABLE IF NOT EXISTS sms_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
  phone_number    VARCHAR(20)  NOT NULL,
  message_type    VARCHAR(30)  NOT NULL CHECK (message_type IN ('otp_login','otp_reset','credentials','verification','custom')),
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed')),
  provider        VARCHAR(20)  DEFAULT 'twilio',
  provider_sid    VARCHAR(64),
  sent_at         TIMESTAMPTZ  DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB        DEFAULT '{}',
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id     ON sms_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone       ON sms_logs (phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status      ON sms_logs (status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at     ON sms_logs (sent_at DESC);

-- 4. SMS settings table (platform-level config)
CREATE TABLE IF NOT EXISTS sms_settings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name    VARCHAR(30) DEFAULT 'twilio',
  sender_id        VARCHAR(20) DEFAULT 'HubNest',
  otp_expiry_secs  INT         DEFAULT 300,
  max_otp_attempts INT         DEFAULT 5,
  rate_limit_per_hour INT      DEFAULT 10,
  is_enabled       BOOLEAN     DEFAULT TRUE,
  templates        JSONB       DEFAULT '{"otp":"Your HubNest CRM OTP is: {otp}. Valid for {expiry} minutes.","credentials":"Welcome to HubNest CRM! Login: {email} | Password: {password} | URL: {url}"}',
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_by       UUID        REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings row (only if empty)
INSERT INTO sms_settings (id) VALUES (gen_random_uuid())
  ON CONFLICT DO NOTHING;

-- 5. Backfill: copy existing phone column into phone_number for users who have phone
UPDATE users SET phone_number = phone WHERE phone IS NOT NULL AND phone_number IS NULL;
