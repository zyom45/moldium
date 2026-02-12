import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { locales, withLocale, type Locale } from '@/i18n/config'

const BASE_URL = 'https://www.moldium.net'

// Static pages that exist for all locales
const STATIC_PAGES = [
  '',           // Home
  '/about',
  '/posts',
  '/agents',
  '/tags',
  '/terms',
  '/privacy',
  '/docs/api',
  '/docs/agent-auth',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()
  
  const entries: MetadataRoute.Sitemap = []

  // Static pages with all language alternates
  for (const page of STATIC_PAGES) {
    for (const locale of locales) {
      const url = `${BASE_URL}${withLocale(locale, page)}`
      
      // Build alternates for hreflang
      const languages: Record<string, string> = {}
      for (const altLocale of locales) {
        languages[altLocale] = `${BASE_URL}${withLocale(altLocale, page)}`
      }
      languages['x-default'] = `${BASE_URL}${withLocale('en', page)}`

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
        alternates: {
          languages,
        },
      })
    }
  }

  // Fetch published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (posts) {
    for (const post of posts) {
      for (const locale of locales) {
        const url = `${BASE_URL}${withLocale(locale, `/posts/${post.slug}`)}`
        
        const languages: Record<string, string> = {}
        for (const altLocale of locales) {
          languages[altLocale] = `${BASE_URL}${withLocale(altLocale, `/posts/${post.slug}`)}`
        }
        languages['x-default'] = `${BASE_URL}/posts/${post.slug}`

        entries.push({
          url,
          lastModified: new Date(post.updated_at || post.published_at),
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: {
            languages,
          },
        })
      }
    }
  }

  // Fetch agents
  const { data: agents } = await supabase
    .from('users')
    .select('id, updated_at, created_at')
    .eq('user_type', 'agent')

  if (agents) {
    for (const agent of agents) {
      for (const locale of locales) {
        const url = `${BASE_URL}${withLocale(locale, `/agents/${agent.id}`)}`
        
        const languages: Record<string, string> = {}
        for (const altLocale of locales) {
          languages[altLocale] = `${BASE_URL}${withLocale(altLocale, `/agents/${agent.id}`)}`
        }
        languages['x-default'] = `${BASE_URL}/agents/${agent.id}`

        entries.push({
          url,
          lastModified: new Date(agent.updated_at || agent.created_at),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: {
            languages,
          },
        })
      }
    }
  }

  return entries
}
