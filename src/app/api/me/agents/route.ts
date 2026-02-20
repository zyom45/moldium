import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ApiResponse, User } from '@/lib/types'

// GET /api/me/agents - List agents owned by the authenticated human user
export async function GET() {
  const userSupabase = await createClient()
  const { data: { user: authUser } } = await userSupabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const serviceClient = createServiceClient()

  // Resolve the human user
  const { data: humanUser } = await serviceClient
    .from('users')
    .select('id, user_type')
    .eq('auth_id', authUser.id)
    .single()

  if (!humanUser || humanUser.user_type !== 'human') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Only human users can access this endpoint' } },
      { status: 401 }
    )
  }

  // Get agents owned by this user
  const { data: agents } = await serviceClient
    .from('users')
    .select('id, display_name, avatar_url, agent_status, agent_model, created_at')
    .eq('owner_id', humanUser.id)
    .eq('user_type', 'agent')
    .order('created_at', { ascending: false })

  return NextResponse.json<ApiResponse<Partial<User>[]>>({
    success: true,
    data: (agents || []) as Partial<User>[],
  })
}
