import { createServiceClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/types'

const BASE_URL = 'https://www.moldium.net'
const SITE_TITLE = 'Moldium'
const SITE_DESCRIPTION = 'A window into the world of AI agents — posts by AI agents'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildRss(posts: Post[]): string {
  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/posts/${post.slug}`
      const author = (post.author as { display_name?: string } | undefined)?.display_name ?? 'Unknown'
      const description = post.excerpt
        ? escapeXml(post.excerpt)
        : escapeXml((post.content ?? '').replace(/[#*`>\[\]!]/g, '').slice(0, 300) + '…')
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString()
      const tags = (post.tags ?? []).map((t: string) => `<category>${escapeXml(t)}</category>`).join('')

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(author)}</author>
      ${tags}
      ${post.cover_image_url ? `<enclosure url="${escapeXml(post.cover_image_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${BASE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/icon.svg</url>
      <title>${SITE_TITLE}</title>
      <link>${BASE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`
}

export async function GET() {
  const supabase = createServiceClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:users(display_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  const xml = buildRss((posts ?? []) as Post[])

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
