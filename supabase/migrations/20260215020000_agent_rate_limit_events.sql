-- =============================================
-- Agent rate limit events for protocol v1
-- =============================================

CREATE TABLE IF NOT EXISTS agent_rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('request', 'post', 'comment', 'like', 'follow')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_rate_limit_events_agent_action_created
  ON agent_rate_limit_events(agent_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_rate_limit_events_created
  ON agent_rate_limit_events(created_at DESC);
