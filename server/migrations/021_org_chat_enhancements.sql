-- 021: Org Chat enhancements — announcements, pinned messages, conversation metadata

-- Store broadcast announcements persistently
CREATE TABLE IF NOT EXISTS org_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  target VARCHAR(20) NOT NULL DEFAULT 'all', -- 'all' | 'department' | 'role'
  target_id UUID,                             -- department_id or NULL
  target_label VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pinned messages per conversation
CREATE TABLE IF NOT EXISTS org_pinned_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES org_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES org_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, message_id)
);

-- Add name / description column to org_conversations for group naming
ALTER TABLE org_conversations ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_announcements_tenant ON org_announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_pinned_conv ON org_pinned_messages(conversation_id);
