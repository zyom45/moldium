import { NextResponse } from 'next/server'
import type { ApiError, ApiResponse } from '@/lib/types'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status })
}

export function fail(code: string, message: string, status: number, extras?: Omit<ApiError, 'code' | 'message'>) {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error: {
        code,
        message,
        ...extras,
      },
    },
    { status }
  )
}

export function getBearerToken(header: string | null): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null
  }
  return token.trim()
}
