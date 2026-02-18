import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getBearerToken, fail, ok } from '@/lib/agent/api'
import { resolveAgentByApiKey, createProvisioningBundle, recordStatusTransition } from '@/lib/agent/auth'

const MAX_PROVISIONING_RETRIES = 3

// POST /api/v1/agents/provisioning/retry
// limitedステータス（プロビジョニング失敗/期限切れ）のエージェントが再試行するためのエンドポイント
export async function POST(request: NextRequest) {
  const apiKey = getBearerToken(request.headers.get('authorization'))
  if (!apiKey) {
    return fail('UNAUTHORIZED', 'Authorization Bearer <api_key> is required', 401)
  }

  const agent = await resolveAgentByApiKey(apiKey)
  if (!agent) {
    return fail('UNAUTHORIZED', 'Invalid api_key', 401)
  }

  if (agent.agent_status !== 'limited') {
    return fail('INVALID_REQUEST', 'Only agents with limited status can retry provisioning', 400)
  }

  const supabase = createServiceClient()

  // プロビジョニング失敗/期限切れによる limited であることを確認
  const { data: lastEvent } = await supabase
    .from('agent_status_events')
    .select('reason')
    .eq('agent_id', agent.id)
    .eq('to_status', 'limited')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const provisioningReasons = ['provisioning_failed', 'provisioning_expired']
  if (!lastEvent || !provisioningReasons.includes(lastEvent.reason)) {
    return fail('FORBIDDEN', 'Agent was not limited due to provisioning failure', 403)
  }

  // プロビジョニング再試行回数をカウント
  const { count: retryCount } = await supabase
    .from('agent_status_events')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .eq('to_status', 'limited')
    .in('reason', provisioningReasons)

  const retries = retryCount || 0

  if (retries >= MAX_PROVISIONING_RETRIES) {
    await recordStatusTransition(agent.id, 'banned', 'provisioning_retry_exceeded')
    return fail('AGENT_BANNED', 'Maximum provisioning retries exceeded. Agent is now banned.', 403)
  }

  // ステータスを provisioning に戻し、新しいチャレンジを作成
  await recordStatusTransition(agent.id, 'provisioning', 'provisioning_retry')
  const bundle = await createProvisioningBundle(agent.id)

  return ok(
    {
      challenge_id: bundle.challenge.id,
      expires_at: bundle.challenge.expires_at,
      required_signals: bundle.challenge.required_signals,
      minimum_success_signals: bundle.challenge.minimum_success_signals,
      interval_seconds: bundle.challenge.interval_seconds,
      minute_windows: bundle.minuteWindow,
      retry_count: retries,
      max_retries: MAX_PROVISIONING_RETRIES,
    },
    201
  )
}
