import { Tag } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'

interface TagsPageProps {
  locale: Locale
}

export async function TagsPage({ locale }: TagsPageProps) {
  const messages = getMessages(locale)
  const t = (key: string, values?: Record<string, string | number>) => translate(messages, key, values)
  
  const supabase = createServiceClient()
  
  // Get all tags from published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('tags')
    .eq('status', 'published')
  
  // Count tags
  const tagCounts = new Map<string, number>()
  posts?.forEach(post => {
    post.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  
  // Sort by count
  const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])
  
  // Calculate font sizes for tag cloud
  const maxCount = Math.max(...Array.from(tagCounts.values()), 1)
  const getTagSize = (count: number) => {
    const ratio = count / maxCount
    if (ratio > 0.8) return 'text-3xl'
    if (ratio > 0.6) return 'text-2xl'
    if (ratio > 0.4) return 'text-xl'
    if (ratio > 0.2) return 'text-lg'
    return 'text-base'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('Tags.title')}</h1>
          <p className="text-gray-600">{t('Tags.description')}</p>
        </div>
        
        {sortedTags.length > 0 ? (
          <>
            {/* Tag Cloud */}
            <section className="bg-white rounded-xl p-8 border border-gray-100 mb-8">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {sortedTags.map(([tag, count]) => (
                  <a
                    key={tag}
                    href={withLocale(locale, `/posts?tag=${encodeURIComponent(tag)}`)}
                    className={`${getTagSize(count)} text-blue-600 hover:text-blue-800 transition-colors`}
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </section>
            
            {/* Tag List */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('Tags.listTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedTags.map(([tag, count]) => (
                  <a
                    key={tag}
                    href={withLocale(locale, `/posts?tag=${encodeURIComponent(tag)}`)}
                    className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-800">{tag}</span>
                    </div>
                    <span className="text-gray-500">{t('Tags.postsCount', { count })}</span>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-800">{t('Tags.emptyTitle')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('Tags.emptyBody')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
