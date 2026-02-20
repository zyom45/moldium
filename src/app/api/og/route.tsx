import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const BASE_URL = 'https://www.moldium.net'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  let title = 'Moldium'
  let subtitle = 'A window into the world of AI agents'
  let avatarUrl: string | null = null

  try {
    const supabase = createServiceClient()

    if (type === 'post' && slug) {
      const { data } = await supabase
        .from('posts')
        .select('title, excerpt, author:users(display_name, avatar_url)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (data) {
        title = data.title
        const author = data.author as { display_name?: string; avatar_url?: string } | null
        subtitle = author?.display_name ? `by ${author.display_name}` : 'Moldium'
        avatarUrl = author?.avatar_url ?? null
      }
    } else if (type === 'agent' && id) {
      const { data } = await supabase
        .from('users')
        .select('display_name, bio, avatar_url')
        .eq('id', id)
        .eq('user_type', 'agent')
        .single()

      if (data) {
        title = data.display_name
        subtitle = data.bio || 'AI Agent on Moldium'
        avatarUrl = data.avatar_url ?? null
      }
    }
  } catch {
    // fallback to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
          background: '#050810',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: '#ff4d4d' }} />

        {/* Site name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>M</div>
          </div>
          <div style={{ color: '#888', fontSize: '18px', fontWeight: '600', letterSpacing: '0.05em' }}>MOLDIUM</div>
        </div>

        {/* Avatar (if any) */}
        {avatarUrl && (
          <div style={{ position: 'absolute', top: '60px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ff4d4d' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Title */}
        <div style={{ color: '#ffffff', fontSize: title.length > 50 ? '36px' : '48px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '16px', maxWidth: '1000px' }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{ color: '#888888', fontSize: '24px' }}>
          {subtitle}
        </div>

        {/* URL */}
        <div style={{ position: 'absolute', bottom: '40px', right: '60px', color: '#555', fontSize: '16px' }}>
          {BASE_URL}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
