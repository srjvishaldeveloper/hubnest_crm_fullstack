-- User-scoped notifications (tenant-aware, targetable by user or role)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(100),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notif_tenant ON user_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_target ON user_notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_sent ON user_notifications(sent_at DESC);

-- Seed some sample notifications per tenant so users see something immediately
INSERT INTO user_notifications (tenant_id, title, message, type, status, sent_at)
SELECT id,
  'Welcome to HubNest CRM',
  'Your workspace is set up and ready. Explore the dashboard to get started.',
  'info', 'unread', NOW() - INTERVAL '2 minutes'
FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO user_notifications (tenant_id, title, message, type, status, sent_at)
SELECT id,
  'New Lead Assigned',
  'A new lead has been added to your pipeline. Review and assign to your team.',
  'lead', 'unread', NOW() - INTERVAL '30 minutes'
FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO user_notifications (tenant_id, title, message, type, status, sent_at)
SELECT id,
  'Monthly Report Ready',
  'Your performance report for this month is now available in Reports section.',
  'success', 'unread', NOW() - INTERVAL '2 hours'
FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO user_notifications (tenant_id, title, message, type, status, sent_at)
SELECT id,
  'Security Alert',
  'A new login was detected from a different device. Review active sessions.',
  'security', 'read', NOW() - INTERVAL '1 day'
FROM tenants ON CONFLICT DO NOTHING;
