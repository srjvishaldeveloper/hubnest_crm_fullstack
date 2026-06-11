-- 016: MFA & SMS OTP support
-- Stores user MFA preferences and device tracking

CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mfa_enabled     BOOLEAN       NOT NULL DEFAULT FALSE,
  preferred_method VARCHAR(20)  NOT NULL DEFAULT 'email',  -- 'email', 'sms', 'both'
  phone_number    VARCHAR(20),
  phone_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_mfa UNIQUE (user_id),
  CONSTRAINT chk_mfa_method CHECK (preferred_method IN ('email', 'sms', 'both'))
);

CREATE TABLE IF NOT EXISTS login_audit_log (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type      VARCHAR(50)   NOT NULL,  -- 'login_attempt', 'login_success', 'login_failed', 'otp_sent', 'otp_verified', 'otp_failed', 'mfa_enabled', 'mfa_disabled'
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  device_type     VARCHAR(100),
  browser         VARCHAR(100),
  os              VARCHAR(100),
  location        VARCHAR(255),
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add phone column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_user_id ON login_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_event ON login_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_login_audit_created ON login_audit_log(created_at DESC);
