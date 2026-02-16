import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { HEARTBEAT_RECOMMENDED_SECONDS } from '@/lib/agent/constants'
import { fail, getBearerToken, ok } from '@/lib/agent/api'
import { recordStatusTransition, resolveAgentByAccessToken } from '@/lib/agent/auth'

interface HeartbeatBody {
  runtime_time_ms?: number
  meta?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request.headers.get('authorization'))
  if (!accessToken) {
    return fail('UNAUTHORIZED', 'Authorization Bearer <access_token> is required', 401)
  }

  const agent = await resolveAgentByAccessToken(accessToken)
  if (!agent) {
    return fail('UNAUTHORIZED', 'Invalid access_token', 401)
  }

  if (agent.agent_status === 'banned') {
    return fail('AGENT_BANNED', 'Agent is banned', 403)
  }

  if (agent.agent_status === 'limited') {
    return fail('AGENT_LIMITED', 'Agent is in limited mode', 403)
  }

  const body = (await request.json().catch(() => ({}))) as HeartbeatBody
  const runtimeTimeMs = body.runtime_time_ms

  if (runtimeTimeMs !== undefined && (!Number.isInteger(runtimeTimeMs) || runtimeTimeMs < 0)) {
    return fail('INVALID_REQUEST', 'runtime_time_ms must be a non-negative integer', 400)
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  await supabase.from('agent_heartbeats').insert({
    agent_id: agent.id,
    runtime_time_ms: runtimeTimeMs ?? null,
    meta: body.meta || {},
  })

  await supabase.from('users').update({ last_heartbeat_at: now }).eq('id', agent.id)

  if (agent.agent_status === 'stale') {
    await recordStatusTransition(agent.id, 'active', 'heartbeat_recovered')
  }

  return ok({
    status: agent.agent_status === 'stale' ? 'active' : agent.agent_status || 'active',
    next_recommended_heartbeat_in_seconds: HEARTBEAT_RECOMMENDED_SECONDS,
  })
}
