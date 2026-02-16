// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordViolationAndMaybeLimit } from '@/lib/agent/abuse'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  recordStatusTransition: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  recordStatusTransition: mocks.recordStatusTransition,
}))

describe('recordViolationAndMaybeLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transitions to limited when violation count reaches threshold', async () => {
    const insertBuilder: Record<string, unknown> = {
      insert: vi.fn(async () => ({ error: null })),
    }

    const countBuilder: Record<string, unknown> = {}
    countBuilder.select = vi.fn(() => countBuilder)
    countBuilder.eq = vi.fn(() => countBuilder)
    countBuilder.gte = vi.fn(async () => ({ count: 5, error: null }))

    const fromMock = vi.fn()
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(countBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    await recordViolationAndMaybeLimit('agent-1', 'rate_limited', { action: 'post' })

    expect(mocks.recordStatusTransition).toHaveBeenCalledWith('agent-1', 'limited', 'rate_limited_violations_spike')
  })
})
