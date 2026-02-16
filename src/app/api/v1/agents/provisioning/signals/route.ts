import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getBearerToken, fail, ok } from '@/lib/agent/api'
import { resolveAgentByApiKey, recordStatusTransition } from '@/lib/agent/auth'

interface ProvisioningSignalBody {
  challenge_id?: string
  sequence?: number
  sent_at?: string
}

export async function POST(request: NextRequest) {
  const apiKey = getBearerToken(request.headers.get('authorization'))
  if (!apiKey) {
    return fail('UNAUTHORIZED', 'Authorization Bearer <api_key> is required', 401)
  }

  const agent = await resolveAgentByApiKey(apiKey)
  if (!agent) {
    return fail('UNAUTHORIZED', 'Invalid api_key', 401)
  }

  const body = (await request.json().catch(() => null)) as ProvisioningSignalBody | null
  if (!body?.challenge_id || body.sequence === undefined || !body.sent_at) {
    return fail('INVALID_REQUEST', 'challenge_id, sequence and sent_at are required', 400)
  }

  if (!Number.isInteger(body.sequence) || body.sequence < 1 || body.sequence > 100) {
    return fail('INVALID_REQUEST', 'sequence must be an integer from 1 to 100', 400)
  }

  const supabase = createServiceClient()

  const { data: challenge } = await supabase
    .from('agent_provisioning_challenges')
    .select('*')
    .eq('id', body.challenge_id)
    .eq('agent_id', agent.id)
    .single()

  if (!challenge) {
    return fail('INVALID_REQUEST', 'Challenge not found', 404)
  }

  if (challenge.status !== 'pending') {
    return fail('PROVISIONING_FAILED', 'Challenge is no longer pending', 409)
  }

  const now = new Date()
  const accepted = new Date(challenge.expires_at).getTime() > now.getTime()

  const { error: insertError } = await supabase.from('agent_provisioning_signals').insert({
    challenge_id: challenge.id,
    sequence: body.sequence,
    accepted,
    reason: accepted ? null : 'challenge_expired',
  })

  if (insertError?.code === '23505') {
    return fail('CONFLICT', 'Sequence already submitted', 409)
  }

  if (insertError) {
    return fail('INVALID_REQUEST', insertError.message, 400)
  }

  const { count: acceptedCount } = await supabase
    .from('agent_provisioning_signals')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id)
    .eq('accepted', true)

  const { count: totalCount } = await supabase
    .from('agent_provisioning_signals')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id)

  const acceptedSignals = acceptedCount || 0
  const submittedSignals = totalCount || 0

  if (acceptedSignals >= challenge.minimum_success_signals) {
    await supabase.from('agent_provisioning_challenges').update({ status: 'success' }).eq('id', challenge.id)
    await recordStatusTransition(agent.id, 'active', 'provisioning_passed')

    return ok({
      status: 'active',
      accepted_signals: acceptedSignals,
      submitted_signals: submittedSignals,
      challenge_status: 'success',
    })
  }

  const required = challenge.required_signals as number
  const challengeExpired = !accepted
  const cannotRecover = submittedSignals >= required && acceptedSignals < challenge.minimum_success_signals

  if (challengeExpired || cannotRecover) {
    await supabase
      .from('agent_provisioning_challenges')
      .update({ status: challengeExpired ? 'expired' : 'failed' })
      .eq('id', challenge.id)

    await recordStatusTransition(agent.id, 'limited', challengeExpired ? 'provisioning_expired' : 'provisioning_failed')

    return fail('PROVISIONING_FAILED', 'Provisioning challenge failed', 403)
  }

  return ok({
    status: agent.agent_status || 'provisioning',
    accepted_signals: acceptedSignals,
    submitted_signals: submittedSignals,
    challenge_status: 'pending',
  })
}
