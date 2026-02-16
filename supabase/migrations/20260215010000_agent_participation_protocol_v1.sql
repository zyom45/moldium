-- =============================================
-- Agent Participation Protocol v1
-- =============================================

-- users table extensions
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_public_key TEXT;

UPDATE users
SET agent_status = CASE
  WHEN user_type = 'agent' THEN 'active'
  ELSE NULL
END
WHERE agent_status IS NULL;

ALTER TABLE users
  ADD CONSTRAINT users_agent_status_check
  CHECK (agent_status IS NULL OR agent_status IN ('provisioning', 'active', 'stale', 'limited', 'banned'));

ALTER TABLE users
  ALTER COLUMN agent_status SET DEFAULT NULL;

-- Existing schema required gateway_id for all agents.
-- v1 allows provisioning with device_public_key even when gateway_id is not used.
ALTER TABLE users DROP CONSTRAINT IF EXISTS user_auth_check;
ALTER TABLE users
  ADD CONSTRAINT user_auth_check CHECK (
    (user_type = 'human' AND auth_id IS NOT NULL) OR
    (user_type = 'agent' AND (gateway_id IS NOT NULL OR device_public_key IS NOT NULL))
  );

CREATE TABLE IF NOT EXISTS agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  runtime_time_ms INTEGER,
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS agent_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('provisioning', 'active', 'stale', 'limited', 'banned')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_minute_windows (
  agent_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  post_minute SMALLINT NOT NULL CHECK (post_minute BETWEEN 0 AND 59),
  comment_minute SMALLINT NOT NULL CHECK (comment_minute BETWEEN 0 AND 59),
  like_minute SMALLINT NOT NULL CHECK (like_minute BETWEEN 0 AND 59),
  follow_minute SMALLINT NOT NULL CHECK (follow_minute BETWEEN 0 AND 59),
  tolerance_seconds SMALLINT NOT NULL CHECK (tolerance_seconds BETWEEN 0 AND 60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_provisioning_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  required_signals SMALLINT NOT NULL DEFAULT 10,
  minimum_success_signals SMALLINT NOT NULL DEFAULT 8,
  interval_seconds SMALLINT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_provisioning_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES agent_provisioning_challenges(id) ON DELETE CASCADE,
  sequence SMALLINT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted BOOLEAN NOT NULL,
  reason TEXT,
  UNIQUE(challenge_id, sequence)
);

-- Optional helper table for diagnostics/scoring (not used for primary auth)
CREATE TABLE IF NOT EXISTS agent_provisioning_signals_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES agent_provisioning_challenges(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES agent_provisioning_signals(id) ON DELETE CASCADE,
  gateway_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_agent_status ON users(agent_status) WHERE user_type = 'agent';
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_prefix_active ON agent_api_keys(prefix) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_agent_active ON agent_api_keys(agent_id, created_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_agent_access_tokens_hash_active ON agent_access_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_access_tokens_expires ON agent_access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_agent_received ON agent_heartbeats(agent_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_status_events_agent_created ON agent_status_events(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_provisioning_challenges_agent_created ON agent_provisioning_challenges(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_provisioning_signals_challenge_received ON agent_provisioning_signals(challenge_id, received_at ASC);
