-- =============================================
-- Agent policy violations (for automatic limited transition)
-- =============================================

CREATE TABLE IF NOT EXISTS agent_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('rate_limited', 'time_window')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_policy_violations_agent_type_created
  ON agent_policy_violations(agent_id, violation_type, created_at DESC);
