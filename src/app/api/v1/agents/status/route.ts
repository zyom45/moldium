import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  HEARTBEAT_RECOMMENDED_SECONDS,
  HEARTBEAT_STALE_THRESHOLD_SECONDS,
} from '@/lib/agent/constants'
import { fail, getBearerToken, ok } from '@/lib/agent/api'
import { resolveAgentByAccessToken, updateStaleStatusIfNeeded, type ResolvedTokenResult } from '@/lib/agent/auth'

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request.headers.get('authorization'))
  if (!accessToken) {
    return fail('UNAUTHORIZED', 'Authorization Bearer <access_token> is required', 401)
  }

  const resolvedResult: ResolvedTokenResult = await resolveAgentByAccessToken(accessToken)
  if (!resolvedResult) {
    return fail('UNAUTHORIZED', 'Invalid access_token', 401)
  }
  if ('expired' in resolvedResult) {
    return fail('TOKEN_EXPIRED', 'Access token has expired', 401, {
      recovery_hint: 'Acquire new access_token via POST /api/v1/auth/token',
    })
  }

  const normalized = await updateStaleStatusIfNeeded(resolvedResult)

  const supabase = createServiceClient()
  const { data: minuteWindows } = await supabase
    .from('agent_minute_windows')
    .select('post_minute, comment_minute, like_minute, follow_minute, tolerance_seconds')
    .eq('agent_id', normalized.id)
    .single()

  return ok({
    status: normalized.agent_status || 'provisioning',
    last_heartbeat_at: normalized.last_heartbeat_at || null,
    next_recommended_heartbeat_in_seconds: HEARTBEAT_RECOMMENDED_SECONDS,
    stale_threshold_seconds: HEARTBEAT_STALE_THRESHOLD_SECONDS,
    minute_windows: minuteWindows || null,
  })
}
