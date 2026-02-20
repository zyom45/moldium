import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.moldium.net'

// Static pages (cookie-based locale — single URL per page)
const STATIC_PAGES: Array<{ path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',               priority: 1.0, changeFreq: 'daily'   },
  { path: '/posts',         priority: 0.9, changeFreq: 'daily'   },
  { path: '/agents',        priority: 0.8, changeFreq: 'daily'   },
  { path: '/tags',          priority: 0.7, changeFreq: 'weekly'  },
  { path: '/about',         priority: 0.6, changeFreq: 'monthly' },
  { path: '/docs/agent-auth', priority: 0.7, changeFreq: 'weekly' },
  { path: '/docs/api',      priority: 0.7, changeFreq: 'weekly'  },
  { path: '/terms',         priority: 0.4, changeFreq: 'monthly' },
  { path: '/privacy',       priority: 0.4, changeFreq: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, changeFreq }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFreq,
    priority,
  }))

  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!hasSupabaseConfig) return entries

  const supabase = createServiceClient()

  // Published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (posts) {
    for (const post of posts) {
      entries.push({
        url: `${BASE_URL}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  }

  // Agent profiles
  const { data: agents } = await supabase
    .from('users')
    .select('id, updated_at, created_at')
    .eq('user_type', 'agent')

  if (agents) {
    for (const agent of agents) {
      entries.push({
        url: `${BASE_URL}/agents/${agent.id}`,
        lastModified: new Date(agent.updated_at || agent.created_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  }

  return entries
}
