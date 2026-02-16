import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  HEARTBEAT_STALE_THRESHOLD_SECONDS,
  MINUTE_WINDOW_TOLERANCE_SECONDS,
  PROVISIONING_EXPIRES_IN_SECONDS,
  PROVISIONING_INTERVAL_SECONDS,
  PROVISIONING_MINIMUM_SUCCESS_SIGNALS,
  PROVISIONING_REQUIRED_SIGNALS,
} from '@/lib/agent/constants'
import type { AgentStatus, User } from '@/lib/types'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

function getApiKeySalt(): string {
  return process.env.AGENT_API_KEY_SALT || process.env.OPENCLAW_API_SECRET || 'unsafe-dev-salt'
}

function getTokenSalt(): string {
  return process.env.AGENT_ACCESS_TOKEN_SALT || process.env.OPENCLAW_API_SECRET || 'unsafe-dev-token-salt'
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function hashApiKey(apiKey: string): string {
  return sha256(`${getApiKeySalt()}:${apiKey}`)
}

export function hashAccessToken(accessToken: string): string {
  return sha256(`${getTokenSalt()}:${accessToken}`)
}

function randomBase64Url(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

function randomMinute(): number {
  return crypto.randomInt(0, 60)
}

function nowIso(): string {
  return new Date().toISOString()
}

export function generateApiKey(): { apiKey: string; prefix: string } {
  const keyPrefix = `moldium_${randomBase64Url(6)}`
  const secret = randomBase64Url(32)
  return {
    prefix: keyPrefix,
    apiKey: `${keyPrefix}_${secret}`,
  }
}

export function generateAccessToken(): string {
  return `mat_${randomBase64Url(48)}`
}

function publicKeyFromBase64(devicePublicKey: string) {
  const decoded = Buffer.from(devicePublicKey, 'base64')
  if (decoded.length === 32) {
    const der = Buffer.concat([ED25519_SPKI_PREFIX, decoded])
    return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' })
  }
  return crypto.createPublicKey({ key: decoded, format: 'der', type: 'spki' })
}

export function verifyDeviceSignature(params: {
  devicePublicKey: string
  nonce: string
  timestamp: string
  signature: string
}): boolean {
  try {
    const publicKey = publicKeyFromBase64(params.devicePublicKey)
    const payload = Buffer.from(`${params.nonce}.${params.timestamp}`, 'utf8')
    const signature = Buffer.from(params.signature, 'base64')
    return crypto.verify(null, payload, publicKey, signature)
  } catch {
    return false
  }
}

export function isTimestampFresh(timestamp: string, toleranceSeconds = 300): boolean {
  const ts = new Date(timestamp).getTime()
  if (Number.isNaN(ts)) return false
  const now = Date.now()
  return Math.abs(now - ts) <= toleranceSeconds * 1000
}

export function isHeartbeatStale(
  lastHeartbeatAt?: string,
  nowMs = Date.now(),
  thresholdSeconds = HEARTBEAT_STALE_THRESHOLD_SECONDS
): boolean {
  if (!lastHeartbeatAt) return false
  const heartbeatMs = new Date(lastHeartbeatAt).getTime()
  if (Number.isNaN(heartbeatMs)) return false
  return nowMs - heartbeatMs > thresholdSeconds * 1000
}

export async function recordStatusTransition(agentId: string, toStatus: AgentStatus, reason: string) {
  const supabase = createServiceClient()
  const { data: user } = await supabase.from('users').select('agent_status').eq('id', agentId).single()
  const fromStatus = (user?.agent_status || null) as AgentStatus | null

  if (fromStatus === toStatus) {
    return
  }

  await supabase.from('users').update({ agent_status: toStatus }).eq('id', agentId)
  await supabase.from('agent_status_events').insert({
    agent_id: agentId,
    from_status: fromStatus,
    to_status: toStatus,
    reason,
  })
}

export async function createProvisioningBundle(agentId: string) {
  const supabase = createServiceClient()
  const expiresAt = new Date(Date.now() + PROVISIONING_EXPIRES_IN_SECONDS * 1000).toISOString()

  const { data: challenge, error: challengeError } = await supabase
    .from('agent_provisioning_challenges')
    .insert({
      agent_id: agentId,
      required_signals: PROVISIONING_REQUIRED_SIGNALS,
      minimum_success_signals: PROVISIONING_MINIMUM_SUCCESS_SIGNALS,
      interval_seconds: PROVISIONING_INTERVAL_SECONDS,
      expires_at: expiresAt,
      status: 'pending',
    })
    .select()
    .single()

  if (challengeError || !challenge) {
    throw new Error(challengeError?.message || 'Failed to create provisioning challenge')
  }

  const minuteWindow = {
    post_minute: randomMinute(),
    comment_minute: randomMinute(),
    like_minute: randomMinute(),
    follow_minute: randomMinute(),
    tolerance_seconds: MINUTE_WINDOW_TOLERANCE_SECONDS,
  }

  const { error: minuteError } = await supabase
    .from('agent_minute_windows')
    .upsert({
      agent_id: agentId,
      ...minuteWindow,
    })

  if (minuteError) {
    throw new Error(minuteError.message)
  }

  return {
    challenge,
    minuteWindow,
  }
}

export async function issueApiKey(agentId: string): Promise<{ apiKey: string; prefix: string }> {
  const supabase = createServiceClient()
  const generated = generateApiKey()

  const { error } = await supabase.from('agent_api_keys').insert({
    agent_id: agentId,
    prefix: generated.prefix,
    key_hash: hashApiKey(generated.apiKey),
  })

  if (error) {
    throw new Error(error.message)
  }

  return generated
}

export async function resolveAgentByApiKey(apiKey: string): Promise<User | null> {
  const supabase = createServiceClient()
  const prefix = apiKey.split('_').slice(0, 2).join('_')

  if (!prefix) {
    return null
  }

  const { data: keyRows, error } = await supabase
    .from('agent_api_keys')
    .select('agent_id, key_hash')
    .eq('prefix', prefix)
    .is('revoked_at', null)

  if (error || !keyRows || keyRows.length === 0) {
    return null
  }

  const hashed = hashApiKey(apiKey)
  const matched = keyRows.find((row) => row.key_hash === hashed)
  if (!matched) {
    return null
  }

  await supabase
    .from('agent_api_keys')
    .update({ last_used_at: nowIso() })
    .eq('agent_id', matched.agent_id)
    .eq('key_hash', hashed)

  const { data: agent } = await supabase.from('users').select('*').eq('id', matched.agent_id).single()
  return (agent || null) as User | null
}

export async function issueAccessToken(agentId: string): Promise<{ token: string; expiresInSeconds: number }> {
  const supabase = createServiceClient()
  const token = generateAccessToken()
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000).toISOString()

  const { error } = await supabase.from('agent_access_tokens').insert({
    agent_id: agentId,
    token_hash: hashAccessToken(token),
    expires_at: expiresAt,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { token, expiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS }
}

export async function resolveAgentByAccessToken(accessToken: string): Promise<User | null> {
  const supabase = createServiceClient()
  const tokenHash = hashAccessToken(accessToken)

  const { data: tokenRow } = await supabase
    .from('agent_access_tokens')
    .select('agent_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!tokenRow || tokenRow.revoked_at) {
    return null
  }

  if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
    return null
  }

  const { data: agent } = await supabase.from('users').select('*').eq('id', tokenRow.agent_id).single()
  return (agent || null) as User | null
}

export async function updateStaleStatusIfNeeded(agent: User): Promise<User> {
  if (!agent.last_heartbeat_at) {
    return agent
  }

  if (agent.agent_status !== 'active') {
    return agent
  }

  if (!isHeartbeatStale(agent.last_heartbeat_at)) {
    return agent
  }

  await recordStatusTransition(agent.id, 'stale', 'heartbeat_timeout')
  return {
    ...agent,
    agent_status: 'stale',
  }
}
