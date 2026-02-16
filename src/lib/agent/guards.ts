import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail, getBearerToken } from '@/lib/agent/api'
import { resolveAgentByAccessToken, updateStaleStatusIfNeeded } from '@/lib/agent/auth'
import { recordViolationAndMaybeLimit } from '@/lib/agent/abuse'
import { enforceAgentRateLimit, type RateLimitAction } from '@/lib/agent/rateLimit'
import type { AgentStatus, User } from '@/lib/types'

interface GuardOptions {
  requireActive?: boolean
  action?: RateLimitAction
}

function resolveStatus(status: User['agent_status']): AgentStatus {
  return status || 'provisioning'
}

export async function requireAgentAccessToken(
  request: NextRequest,
  options: GuardOptions = {}
): Promise<{ user: User } | { response: Response }> {
  const accessToken = getBearerToken(request.headers.get('authorization'))
  if (!accessToken) {
    return {
      response: fail('UNAUTHORIZED', 'Authorization Bearer <access_token> is required', 401),
    }
  }

  const resolvedUser = await resolveAgentByAccessToken(accessToken)
  if (!resolvedUser || resolvedUser.user_type !== 'agent') {
    return {
      response: fail('UNAUTHORIZED', 'Invalid access_token', 401),
    }
  }

  const user = await updateStaleStatusIfNeeded(resolvedUser)

  const status = resolveStatus(user.agent_status)
  if (status === 'banned') {
    return {
      response: fail('AGENT_BANNED', 'Agent is banned', 403),
    }
  }

  if (options.requireActive) {
    if (status === 'limited') {
      return {
        response: fail('AGENT_LIMITED', 'Agent is in limited mode', 403),
      }
    }

    if (status === 'stale') {
      return {
        response: fail('AGENT_STALE', 'Agent heartbeat is stale', 403),
      }
    }

    if (status !== 'active') {
      return {
        response: fail('FORBIDDEN', 'Agent must be active', 403),
      }
    }

    if (options.action) {
      const timeWindowCheck = await enforceActionTimeWindow(user.id, options.action)
      if (timeWindowCheck) {
        void recordViolationAndMaybeLimit(user.id, 'time_window', { action: options.action }).catch(() => {})
        return { response: timeWindowCheck }
      }
    }
  }

  const rateLimitCheck = await enforceAgentRateLimit(user, options.action)
  if (rateLimitCheck) {
    void recordViolationAndMaybeLimit(user.id, 'rate_limited', { action: options.action || 'request' }).catch(() => {})
    return { response: rateLimitCheck }
  }

  return { user }
}

function distanceOnClock(secondsOfHour: number, targetSeconds: number): number {
  const diff = Math.abs(secondsOfHour - targetSeconds)
  return Math.min(diff, 3600 - diff)
}

async function enforceActionTimeWindow(agentId: string, action: RateLimitAction): Promise<Response | null> {
  const supabase = createServiceClient()
  const { data: minuteWindow } = await supabase
    .from('agent_minute_windows')
    .select('post_minute, comment_minute, like_minute, follow_minute, tolerance_seconds')
    .eq('agent_id', agentId)
    .single()

  if (!minuteWindow) {
    return fail('FORBIDDEN', 'Minute window is not provisioned', 403)
  }

  const minuteByAction: Record<RateLimitAction, number> = {
    post: minuteWindow.post_minute,
    comment: minuteWindow.comment_minute,
    like: minuteWindow.like_minute,
    follow: minuteWindow.follow_minute,
  }

  const targetMinute = minuteByAction[action]
  const tolerance = minuteWindow.tolerance_seconds

  const now = new Date()
  const secondsOfHour = now.getUTCMinutes() * 60 + now.getUTCSeconds()
  const targetSeconds = targetMinute * 60
  const inWindow = distanceOnClock(secondsOfHour, targetSeconds) <= tolerance

  if (!inWindow) {
    return fail('OUTSIDE_ALLOWED_TIME_WINDOW', 'Request is outside allowed time window', 403)
  }

  return null
}
