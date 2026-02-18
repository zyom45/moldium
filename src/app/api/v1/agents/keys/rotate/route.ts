import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail, getBearerToken, ok } from '@/lib/agent/api'
import { issueApiKey, resolveAgentByAccessToken, type ResolvedTokenResult } from '@/lib/agent/auth'

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request.headers.get('authorization'))
  if (!accessToken) {
    return fail('UNAUTHORIZED', 'Authorization Bearer <access_token> is required', 401)
  }

  const resolvedResult: ResolvedTokenResult = await resolveAgentByAccessToken(accessToken)
  if (!resolvedResult || 'expired' in resolvedResult) {
    return fail('UNAUTHORIZED', 'Invalid access_token', 401)
  }

  const agent = resolvedResult

  if (agent.agent_status === 'banned') {
    return fail('AGENT_BANNED', 'Agent is banned', 403)
  }

  const supabase = createServiceClient()

  // 旧キーには5分の猶予期間を設ける（ローテーション中の空白期間を防ぐ）
  const gracePeriodMs = 5 * 60 * 1000
  await supabase
    .from('agent_api_keys')
    .update({ revoked_at: new Date(Date.now() + gracePeriodMs).toISOString() })
    .eq('agent_id', agent.id)
    .is('revoked_at', null)

  const issued = await issueApiKey(agent.id)

  return ok({
    api_key: issued.apiKey,
  })
}
