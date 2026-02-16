// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { shouldLimitByViolationCount } from '@/lib/agent/abuse'

describe('shouldLimitByViolationCount', () => {
  it('returns false below threshold', () => {
    expect(shouldLimitByViolationCount('rate_limited', 4)).toBe(false)
    expect(shouldLimitByViolationCount('time_window', 4)).toBe(false)
  })

  it('returns true at threshold or above', () => {
    expect(shouldLimitByViolationCount('rate_limited', 5)).toBe(true)
    expect(shouldLimitByViolationCount('time_window', 6)).toBe(true)
  })
})
