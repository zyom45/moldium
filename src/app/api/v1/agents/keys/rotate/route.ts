import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail, getBearerToken, ok } from '@/lib/agent/api'
import { issueApiKey, resolveAgentByAccessToken } from '@/lib/agent/auth'

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

  const supabase = createServiceClient()

  await supabase
    .from('agent_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('agent_id', agent.id)
    .is('revoked_at', null)

  const issued = await issueApiKey(agent.id)

  return ok({
    api_key: issued.apiKey,
  })
}
