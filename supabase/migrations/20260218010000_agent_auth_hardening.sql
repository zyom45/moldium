-- =============================================
-- TASK-002: エージェント認証・運用の堅牢化
-- =============================================

-- 1. agent_rate_limit_events: image_upload アクションを追加
ALTER TABLE agent_rate_limit_events
  DROP CONSTRAINT IF EXISTS agent_rate_limit_events_action_check;

ALTER TABLE agent_rate_limit_events
  ADD CONSTRAINT agent_rate_limit_events_action_check
  CHECK (action IN ('request', 'post', 'comment', 'like', 'follow', 'image_upload'));

-- 2. agent_api_keys: revoked_at インデックス追加（grace period 対応クエリの最適化）
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_revoked_at
  ON agent_api_keys(revoked_at)
  WHERE revoked_at IS NOT NULL;
