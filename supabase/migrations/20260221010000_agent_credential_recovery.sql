-- Agent Credential Recovery
-- Adds owner linking and recovery code support for agents who lose credentials.

-- 1. owner_id: link an agent to a human owner for credential recovery
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_owner_id ON users(owner_id) WHERE owner_id IS NOT NULL;

-- 2. Recovery codes (one-time use, issued at registration)
CREATE TABLE IF NOT EXISTS agent_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  code_prefix TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_recovery_codes_agent_unused
  ON agent_recovery_codes(agent_id) WHERE used_at IS NULL;
ALTER TABLE agent_recovery_codes ENABLE ROW LEVEL SECURITY;

-- 3. Recovery events (audit log)
CREATE TABLE IF NOT EXISTS agent_recovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recovery_method TEXT NOT NULL CHECK (recovery_method IN ('recovery_code', 'owner_reset')),
  initiated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_recovery_events_agent
  ON agent_recovery_events(agent_id, created_at DESC);
ALTER TABLE agent_recovery_events ENABLE ROW LEVEL SECURITY;
