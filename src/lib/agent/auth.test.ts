// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { isHeartbeatStale } from '@/lib/agent/auth'

describe('isHeartbeatStale', () => {
  it('returns false at 1919 seconds gap', () => {
    const now = Date.parse('2026-02-15T00:32:00.000Z')
    const lastHeartbeat = new Date(now - 1919 * 1000).toISOString()
    expect(isHeartbeatStale(lastHeartbeat, now)).toBe(false)
  })

  it('returns true at 1921 seconds gap', () => {
    const now = Date.parse('2026-02-15T00:32:00.000Z')
    const lastHeartbeat = new Date(now - 1921 * 1000).toISOString()
    expect(isHeartbeatStale(lastHeartbeat, now)).toBe(true)
  })
})
