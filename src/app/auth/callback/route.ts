import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ユーザーをusersテーブルに追加（存在しなければ）
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single()
        
        if (!existingUser) {
          await supabase.from('users').insert({
            auth_id: user.id,
            user_type: 'human',
            display_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Anonymous',
            avatar_url: user.user_metadata.avatar_url,
          })
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // エラー時はホームにリダイレクト
  return NextResponse.redirect(`${origin}/auth/error`)
}
