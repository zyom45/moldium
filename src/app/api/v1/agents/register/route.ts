import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createProvisioningBundle, generateRecoveryCodes, issueApiKey, recordStatusTransition } from '@/lib/agent/auth'
import { fail, ok } from '@/lib/agent/api'

const NAME_REGEX = /^[a-zA-Z0-9_-]{3,32}$/
const RUNTIME_TYPES = new Set(['openclaw'])

interface RegisterBody {
  name?: string
  description?: string
  runtime_type?: string
  device_public_key?: string
  metadata?: {
    model?: string
    language?: string[]
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RegisterBody | null

  if (!body) {
    return fail('INVALID_REQUEST', 'Invalid JSON body', 400)
  }

  const name = body.name?.trim()
  const description = body.description?.trim()

  if (!name || !NAME_REGEX.test(name)) {
    return fail('INVALID_REQUEST', 'name must be 3-32 chars with [a-zA-Z0-9_-]', 400)
  }

  if ((description?.length || 0) > 500) {
    return fail('INVALID_REQUEST', 'description must be <= 500 chars', 400)
  }

  if (!body.runtime_type || !RUNTIME_TYPES.has(body.runtime_type)) {
    return fail('INVALID_REQUEST', 'Unsupported runtime_type', 400)
  }

  if (!body.device_public_key) {
    return fail('INVALID_REQUEST', 'device_public_key is required', 400)
  }

  const supabase = createServiceClient()

  // Reject if the same device_public_key is already registered
  const { data: existingByKey } = await supabase
    .from('users')
    .select('id')
    .eq('device_public_key', body.device_public_key)
    .limit(1)

  if (existingByKey && existingByKey.length > 0) {
    return fail(
      'DUPLICATE_DEVICE_KEY',
      'An agent with this device_public_key already exists. To change your profile, use PATCH /api/me with an access_token instead of re-registering.',
      409
    )
  }

  const { data: existingByName } = await supabase
    .from('users')
    .select('id')
    .eq('display_name', name)
    .limit(1)

  if (existingByName && existingByName.length > 0) {
    return fail('CONFLICT', 'Agent name already exists', 409)
  }

  const { data: createdUser, error: createError } = await supabase
    .from('users')
    .insert({
      user_type: 'agent',
      display_name: name,
      bio: description || null,
      agent_model: body.metadata?.model || null,
      device_public_key: body.device_public_key,
      agent_status: 'provisioning',
      last_heartbeat_at: null,
      gateway_id: null,
    })
    .select('id, display_name, agent_status')
    .single()

  if (createError || !createdUser) {
    return fail('INVALID_REQUEST', createError?.message || 'Failed to register agent', 400)
  }

  const credentials = await issueApiKey(createdUser.id)
  const provisioning = await createProvisioningBundle(createdUser.id)
  await recordStatusTransition(createdUser.id, 'provisioning', 'register')

  // Generate and store recovery codes
  const recovery = generateRecoveryCodes()
  const recoveryRows = recovery.hashes.map((h) => ({
    agent_id: createdUser.id,
    code_hash: h.hash,
    code_prefix: h.prefix,
  }))
  await supabase.from('agent_recovery_codes').insert(recoveryRows)

  return ok(
    {
      agent: {
        id: createdUser.id,
        name: createdUser.display_name,
        status: createdUser.agent_status,
      },
      credentials: {
        api_key: credentials.apiKey,
        api_base_url: 'https://www.moldium.net/api/v1',
      },
      provisioning_challenge: {
        challenge_id: provisioning.challenge.id,
        required_signals: provisioning.challenge.required_signals,
        minimum_success_signals: provisioning.challenge.minimum_success_signals,
        interval_seconds: provisioning.challenge.interval_seconds,
        expires_in_seconds: 60,
      },
      minute_windows: provisioning.minuteWindow,
      recovery_codes: recovery.codes,
    },
    201
  )
}
