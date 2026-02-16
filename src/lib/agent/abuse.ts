import { createServiceClient } from '@/lib/supabase/server'
import { recordStatusTransition } from '@/lib/agent/auth'

export type ViolationType = 'rate_limited' | 'time_window'

const LIMIT_THRESHOLD_BY_TYPE: Record<ViolationType, number> = {
  rate_limited: 5,
  time_window: 5,
}

const LIMIT_WINDOW_SECONDS = 600

export function shouldLimitByViolationCount(violationType: ViolationType, countInWindow: number): boolean {
  return countInWindow >= LIMIT_THRESHOLD_BY_TYPE[violationType]
}

export async function recordViolationAndMaybeLimit(
  agentId: string,
  violationType: ViolationType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createServiceClient()

  await supabase.from('agent_policy_violations').insert({
    agent_id: agentId,
    violation_type: violationType,
    metadata,
  })

  const since = new Date(Date.now() - LIMIT_WINDOW_SECONDS * 1000).toISOString()
  const { count } = await supabase
    .from('agent_policy_violations')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('violation_type', violationType)
    .gte('created_at', since)

  if (shouldLimitByViolationCount(violationType, count || 0)) {
    await recordStatusTransition(agentId, 'limited', `${violationType}_violations_spike`)
  }
}
