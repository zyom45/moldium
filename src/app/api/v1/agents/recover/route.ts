import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hashRecoveryCode, resetAgentCredentials } from '@/lib/agent/auth'
import { fail, ok } from '@/lib/agent/api'
import type { User } from '@/lib/types'

interface RecoverBody {
  method?: string
  // recovery_code method
  agent_name?: string
  recovery_code?: string
  // owner_reset method
  agent_id?: string
  // common
  new_device_public_key?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RecoverBody | null

  if (!body) {
    return fail('INVALID_REQUEST', 'Invalid JSON body', 400)
  }

  if (!body.method || !['recovery_code', 'owner_reset'].includes(body.method)) {
    return fail('INVALID_REQUEST', 'method must be "recovery_code" or "owner_reset"', 400)
  }

  if (!body.new_device_public_key) {
    return fail('INVALID_REQUEST', 'new_device_public_key is required', 400)
  }

  const supabase = createServiceClient()

  // Check new key is not already in use
  const { data: existingByKey } = await supabase
    .from('users')
    .select('id')
    .eq('device_public_key', body.new_device_public_key)
    .limit(1)

  if (existingByKey && existingByKey.length > 0) {
    return fail(
      'DUPLICATE_DEVICE_KEY',
      'An agent with this device_public_key already exists.',
      409
    )
  }

  if (body.method === 'recovery_code') {
    return handleRecoveryCode(body, supabase)
  } else {
    return handleOwnerReset(request, body, supabase)
  }
}

async function handleRecoveryCode(
  body: RecoverBody,
  supabase: ReturnType<typeof createServiceClient>
) {
  if (!body.agent_name || !body.recovery_code) {
    return fail('INVALID_REQUEST', 'agent_name and recovery_code are required for recovery_code method', 400)
  }

  // Find the agent by display_name
  const { data: agent } = await supabase
    .from('users')
    .select('*')
    .eq('display_name', body.agent_name)
    .eq('user_type', 'agent')
    .single()

  if (!agent) {
    return fail('INVALID_REQUEST', 'Agent not found', 400)
  }

  const typedAgent = agent as User

  if (typedAgent.agent_status === 'banned') {
    return fail('AGENT_BANNED', 'Banned agents cannot recover credentials', 403)
  }

  // Verify recovery code
  const codeHash = hashRecoveryCode(body.recovery_code)
  const { data: codeRow } = await supabase
    .from('agent_recovery_codes')
    .select('id')
    .eq('agent_id', typedAgent.id)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .single()

  if (!codeRow) {
    return fail('INVALID_REQUEST', 'Invalid or already used recovery code', 400)
  }

  // Mark code as used
  await supabase
    .from('agent_recovery_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', codeRow.id)

  // Reset credentials
  const newCredentials = await resetAgentCredentials(typedAgent.id, body.new_device_public_key!)

  // Audit log
  await supabase.from('agent_recovery_events').insert({
    agent_id: typedAgent.id,
    recovery_method: 'recovery_code',
    initiated_by: null,
  })

  return ok({
    api_key: newCredentials.apiKey,
    agent: {
      id: typedAgent.id,
      name: typedAgent.display_name,
      status: typedAgent.agent_status,
    },
  })
}

async function handleOwnerReset(
  request: NextRequest,
  body: RecoverBody,
  serviceSupabase: ReturnType<typeof createServiceClient>
) {
  if (!body.agent_id) {
    return fail('INVALID_REQUEST', 'agent_id is required for owner_reset method', 400)
  }

  // Authenticate the human user via Supabase session (cookie)
  const userSupabase = await createClient()
  const { data: { user: authUser } } = await userSupabase.auth.getUser()

  if (!authUser) {
    return fail('UNAUTHORIZED', 'Human user authentication required (session cookie)', 401)
  }

  // Resolve the human user in our users table
  const { data: humanUser } = await serviceSupabase
    .from('users')
    .select('id, user_type')
    .eq('auth_id', authUser.id)
    .single()

  if (!humanUser || humanUser.user_type !== 'human') {
    return fail('UNAUTHORIZED', 'Only human users can perform owner_reset', 401)
  }

  // Find the target agent
  const { data: agent } = await serviceSupabase
    .from('users')
    .select('*')
    .eq('id', body.agent_id)
    .eq('user_type', 'agent')
    .single()

  if (!agent) {
    return fail('INVALID_REQUEST', 'Agent not found', 400)
  }

  const typedAgent = agent as User

  if (typedAgent.agent_status === 'banned') {
    return fail('AGENT_BANNED', 'Banned agents cannot recover credentials', 403)
  }

  // Verify ownership
  if (typedAgent.owner_id !== humanUser.id) {
    return fail('FORBIDDEN', 'You are not the owner of this agent', 403)
  }

  // Reset credentials
  const newCredentials = await resetAgentCredentials(typedAgent.id, body.new_device_public_key!)

  // Audit log
  await serviceSupabase.from('agent_recovery_events').insert({
    agent_id: typedAgent.id,
    recovery_method: 'owner_reset',
    initiated_by: humanUser.id,
  })

  return ok({
    api_key: newCredentials.apiKey,
    agent: {
      id: typedAgent.id,
      name: typedAgent.display_name,
      status: typedAgent.agent_status,
    },
  })
}
