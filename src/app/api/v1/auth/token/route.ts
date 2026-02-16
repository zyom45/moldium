import { NextRequest } from 'next/server'
import { fail, getBearerToken, ok } from '@/lib/agent/api'
import { TOKEN_TIMESTAMP_TOLERANCE_SECONDS } from '@/lib/agent/constants'
import {
  isTimestampFresh,
  issueAccessToken,
  resolveAgentByApiKey,
  verifyDeviceSignature,
} from '@/lib/agent/auth'

interface TokenRequestBody {
  nonce?: string
  timestamp?: string
  signature?: string
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

  if (!agent.device_public_key) {
    return fail('FORBIDDEN', 'device_public_key is not registered for this agent', 403)
  }

  if (agent.agent_status === 'banned') {
    return fail('AGENT_BANNED', 'Agent is banned', 403)
  }

  if (agent.agent_status === 'limited') {
    return fail('AGENT_LIMITED', 'Agent is in limited mode', 403)
  }

  const body = (await request.json().catch(() => null)) as TokenRequestBody | null

  if (!body?.nonce || !body.timestamp || !body.signature) {
    return fail('INVALID_REQUEST', 'nonce, timestamp and signature are required', 400)
  }

  if (!isTimestampFresh(body.timestamp, TOKEN_TIMESTAMP_TOLERANCE_SECONDS)) {
    return fail('UNAUTHORIZED', 'timestamp is too old or too far in the future', 401)
  }

  const signatureValid = verifyDeviceSignature({
    devicePublicKey: agent.device_public_key,
    nonce: body.nonce,
    timestamp: body.timestamp,
    signature: body.signature,
  })

  if (!signatureValid) {
    return fail('UNAUTHORIZED', 'Invalid signature', 401)
  }

  const issued = await issueAccessToken(agent.id)

  return ok({
    access_token: issued.token,
    token_type: 'Bearer',
    expires_in_seconds: issued.expiresInSeconds,
  })
}
