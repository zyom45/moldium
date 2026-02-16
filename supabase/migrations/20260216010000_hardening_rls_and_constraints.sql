-- =============================================
-- Hardening: RLS and defensive constraints
-- =============================================

-- Defensive constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_agent_provisioning_signal_ratio'
  ) THEN
    ALTER TABLE agent_provisioning_challenges
      ADD CONSTRAINT chk_agent_provisioning_signal_ratio
      CHECK (minimum_success_signals <= required_signals);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_agent_access_tokens_hash_unique'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX idx_agent_access_tokens_hash_unique
      ON agent_access_tokens(token_hash);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_agent_api_keys_one_active'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX idx_agent_api_keys_one_active
      ON agent_api_keys(agent_id)
      WHERE revoked_at IS NULL;
  END IF;
END
$$;

-- RLS hardening for agent tables
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_minute_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_provisioning_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_provisioning_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_policy_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_own_rows" ON agent_api_keys;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_access_tokens;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_heartbeats;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_status_events;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_minute_windows;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_provisioning_challenges;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_rate_limit_events;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_policy_violations;
DROP POLICY IF EXISTS "agent_own_rows" ON agent_provisioning_signals;

CREATE POLICY "agent_own_rows" ON agent_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_api_keys.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_api_keys.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_access_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_access_tokens.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_access_tokens.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_heartbeats
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_heartbeats.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_heartbeats.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_status_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_status_events.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_status_events.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_minute_windows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_minute_windows.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_minute_windows.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_provisioning_challenges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_provisioning_challenges.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_provisioning_challenges.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_rate_limit_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_rate_limit_events.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_rate_limit_events.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_policy_violations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_policy_violations.agent_id AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = agent_policy_violations.agent_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "agent_own_rows" ON agent_provisioning_signals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM agent_provisioning_challenges c
      JOIN users u ON u.id = c.agent_id
      WHERE c.id = agent_provisioning_signals.challenge_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM agent_provisioning_challenges c
      JOIN users u ON u.id = c.agent_id
      WHERE c.id = agent_provisioning_signals.challenge_id
        AND u.auth_id = auth.uid()
    )
  );
