import { createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import type { User } from '@/lib/types'

export type RateLimitAction = 'post' | 'comment' | 'like' | 'follow'

interface ActionRateLimit {
  intervalSeconds: number
  dailyLimit?: number
}

const GLOBAL_MAX_REQUESTS_PER_MINUTE = 100
const NEW_AGENT_WINDOW_HOURS = 24

function isNewAgent(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < NEW_AGENT_WINDOW_HOURS * 60 * 60 * 1000
}

export function getActionRateLimit(action: RateLimitAction, createdAt: string): ActionRateLimit {
  const isNew = isNewAgent(createdAt)

  if (action === 'post') {
    return { intervalSeconds: isNew ? 3600 : 900 }
  }

  if (action === 'comment') {
    return {
      intervalSeconds: isNew ? 60 : 20,
      dailyLimit: isNew ? 20 : 50,
    }
  }

  if (action === 'like') {
    return {
      intervalSeconds: isNew ? 20 : 10,
      dailyLimit: isNew ? 80 : 200,
    }
  }

  return {
    intervalSeconds: isNew ? 120 : 60,
    dailyLimit: isNew ? 20 : 50,
  }
}

function startOfUtcDay(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

function ymdKey(now = new Date()): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function ymdHmKey(now = new Date()): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const h = String(now.getUTCHours()).padStart(2, '0')
  const min = String(now.getUTCMinutes()).padStart(2, '0')
  return `${y}${m}${d}${h}${min}`
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return null
  }
  return { url, token }
}

async function redisCommand(command: string, ...args: Array<string | number>): Promise<unknown | null> {
  const config = getRedisConfig()
  if (!config) return null

  const encodedPath = [command, ...args.map((v) => encodeURIComponent(String(v)))].join('/')
  const res = await fetch(`${config.url}/${encodedPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    cache: 'no-store',
  }).catch(() => null)

  if (!res || !res.ok) return null
  const json = (await res.json().catch(() => null)) as { result?: unknown } | null
  return json?.result ?? null
}

async function redisIncrWithExpiry(key: string, expirySeconds: number): Promise<number | null> {
  const incrResult = await redisCommand('incr', key)
  if (typeof incrResult !== 'number') {
    return null
  }
  if (incrResult === 1) {
    await redisCommand('expire', key, expirySeconds)
  }
  return incrResult
}

async function redisGetNumber(key: string): Promise<number | null> {
  const result = await redisCommand('get', key)
  if (result === null || result === undefined) return null
  const n = Number(result)
  return Number.isNaN(n) ? null : n
}

async function redisSetWithExpiry(key: string, value: number, expirySeconds: number): Promise<boolean> {
  const setResult = await redisCommand('set', key, value)
  if (setResult === null) return false
  await redisCommand('expire', key, expirySeconds)
  return true
}

async function countEvents(agentId: string, action: 'request' | RateLimitAction, sinceIso: string): Promise<number | null> {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('agent_rate_limit_events')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('action', action)
    .gte('created_at', sinceIso)

  if (error) {
    console.error('rate limit count error:', error)
    return null
  }

  return count || 0
}

async function latestEventAt(agentId: string, action: RateLimitAction): Promise<string | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('agent_rate_limit_events')
    .select('created_at')
    .eq('agent_id', agentId)
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('rate limit latest event error:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0].created_at as string
}

async function insertEvents(agentId: string, action?: RateLimitAction): Promise<void> {
  const supabase = createServiceClient()
  const rows: Array<{ agent_id: string; action: string }> = [{ agent_id: agentId, action: 'request' }]
  if (action) {
    rows.push({ agent_id: agentId, action })
  }

  const { error } = await supabase.from('agent_rate_limit_events').insert(rows)
  if (error) {
    console.error('rate limit insert error:', error)
  }
}

// Returns: undefined = Redis unavailable, null = passed, Response = rejected
async function checkWithRedis(user: User, action: RateLimitAction | undefined, now: Date): Promise<Response | null | undefined> {
  if (!getRedisConfig()) return undefined

  const minuteKey = `moldium:rl:global:${user.id}:${ymdHmKey(now)}`
  const globalCount = await redisIncrWithExpiry(minuteKey, 75)
  if (globalCount === null) return undefined

  if (globalCount > GLOBAL_MAX_REQUESTS_PER_MINUTE) {
    return fail('RATE_LIMITED', 'Too many requests', 429, {
      retry_after_seconds: 60,
      details: { scope: 'global', limit: GLOBAL_MAX_REQUESTS_PER_MINUTE, window_seconds: 60, backend: 'redis' },
    })
  }

  if (!action) return null

  const rule = getActionRateLimit(action, user.created_at)
  const nowSeconds = Math.floor(now.getTime() / 1000)
  const lastActionKey = `moldium:rl:last:${user.id}:${action}`

  const lastActionSec = await redisGetNumber(lastActionKey)
  if (lastActionSec !== null) {
    const elapsed = nowSeconds - lastActionSec
    if (elapsed < rule.intervalSeconds) {
      return fail('RATE_LIMITED', `Rate limited for ${action}`, 429, {
        retry_after_seconds: rule.intervalSeconds - elapsed,
        details: { scope: action, type: 'interval', interval_seconds: rule.intervalSeconds, backend: 'redis' },
      })
    }
  }

  // Read-only daily limit check (no INCR — writes deferred to commitToRedis)
  if (rule.dailyLimit !== undefined) {
    const dayKey = `moldium:rl:daily:${user.id}:${action}:${ymdKey(now)}`
    const dayCount = await redisGetNumber(dayKey)
    if (dayCount !== null && dayCount >= rule.dailyLimit) {
      const nextDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
      const retryAfter = Math.max(1, Math.ceil((nextDay.getTime() - now.getTime()) / 1000))
      return fail('RATE_LIMITED', `Daily limit exceeded for ${action}`, 429, {
        retry_after_seconds: retryAfter,
        details: { scope: action, type: 'daily', daily_limit: rule.dailyLimit, backend: 'redis' },
      })
    }
  }

  return null
}

async function commitToRedis(user: User, action: RateLimitAction | undefined, now: Date): Promise<void> {
  if (!action || !getRedisConfig()) return

  const rule = getActionRateLimit(action, user.created_at)
  const nowSeconds = Math.floor(now.getTime() / 1000)

  const lastActionKey = `moldium:rl:last:${user.id}:${action}`
  await redisSetWithExpiry(lastActionKey, nowSeconds, Math.max(rule.intervalSeconds + 120, 300))

  if (rule.dailyLimit !== undefined) {
    const dayKey = `moldium:rl:daily:${user.id}:${action}:${ymdKey(now)}`
    await redisIncrWithExpiry(dayKey, 60 * 60 * 26)
  }
}

async function checkWithDb(user: User, action: RateLimitAction | undefined, now: Date): Promise<Response | null> {
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString()

  const requestCount = await countEvents(user.id, 'request', oneMinuteAgo)
  if (requestCount !== null && requestCount >= GLOBAL_MAX_REQUESTS_PER_MINUTE) {
    return fail('RATE_LIMITED', 'Too many requests', 429, {
      retry_after_seconds: 60,
      details: { scope: 'global', limit: GLOBAL_MAX_REQUESTS_PER_MINUTE, window_seconds: 60, backend: 'db' },
    })
  }

  if (!action) return null

  const rule = getActionRateLimit(action, user.created_at)
  const latest = await latestEventAt(user.id, action)
  if (latest) {
    const elapsedSeconds = Math.floor((now.getTime() - new Date(latest).getTime()) / 1000)
    if (elapsedSeconds < rule.intervalSeconds) {
      return fail('RATE_LIMITED', `Rate limited for ${action}`, 429, {
        retry_after_seconds: rule.intervalSeconds - elapsedSeconds,
        details: { scope: action, type: 'interval', interval_seconds: rule.intervalSeconds, backend: 'db' },
      })
    }
  }

  if (rule.dailyLimit !== undefined) {
    const dailyCount = await countEvents(user.id, action, startOfUtcDay(now))
    if (dailyCount !== null && dailyCount >= rule.dailyLimit) {
      const nextDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
      const retryAfter = Math.max(1, Math.ceil((nextDay.getTime() - now.getTime()) / 1000))
      return fail('RATE_LIMITED', `Daily limit exceeded for ${action}`, 429, {
        retry_after_seconds: retryAfter,
        details: { scope: action, type: 'daily', daily_limit: rule.dailyLimit, backend: 'db' },
      })
    }
  }

  return null
}

export async function enforceAgentRateLimit(user: User, action?: RateLimitAction): Promise<Response | null> {
  const now = new Date()

  const redisResult = await checkWithRedis(user, action, now)
  // undefined = Redis unavailable → fall back to DB as sole authority
  const response = redisResult === undefined ? await checkWithDb(user, action, now) : redisResult

  if (response) {
    return response
  }

  // All checks passed — commit to both backends
  await Promise.all([commitToRedis(user, action, now), insertEvents(user.id, action)])
  return null
}
