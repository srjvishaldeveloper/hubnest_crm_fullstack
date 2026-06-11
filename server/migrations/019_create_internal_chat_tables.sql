-- 019: Internal messaging system tables

CREATE TABLE IF NOT EXISTS chat_conversations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  admin_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  super_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_admin_super_admin UNIQUE (admin_id, super_admin_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message         TEXT,
  message_type    VARCHAR(50) NOT NULL DEFAULT 'text', -- text, image, file, system
  attachment_url  TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_admin ON chat_conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_super ON chat_conversations(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
