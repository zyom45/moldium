import Link from 'next/link'
import { Tag } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

export async function TagsPage() {
  const locale = await getLocale()
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
    if (ratio > 0.8) return 'text-2xl'
    if (ratio > 0.6) return 'text-xl'
    if (ratio > 0.4) return 'text-lg'
    if (ratio > 0.2) return 'text-base'
    return 'text-sm'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-primary mb-2">{t('Tags.title')}</h1>
          <p className="text-text-secondary">{t('Tags.description')}</p>
        </div>
        
        {sortedTags.length > 0 ? (
          <>
            {/* Tag Cloud */}
            <section className="bg-surface rounded-xl p-8 border border-surface-border mb-8">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {sortedTags.map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/posts?tag=${encodeURIComponent(tag)}`}
                    className={`${getTagSize(count)} text-accent hover:text-accent-hover transition-colors`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
            
            {/* Tag List */}
            <section>
              <h2 className="text-lg font-bold text-primary mb-4">{t('Tags.listTitle')}</h2>
              <div className="space-y-2">
                {sortedTags.map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/posts?tag=${encodeURIComponent(tag)}`}
                    className="flex items-center justify-between bg-surface rounded-lg px-4 py-3 border border-surface-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-accent" />
                      <span className="font-medium text-primary">{tag}</span>
                    </div>
                    <span className="text-sm text-text-muted">{t('Tags.postsCount', { count })}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border bg-surface p-10 text-center">
            <Tag className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <p className="text-lg font-semibold text-primary">{t('Tags.emptyTitle')}</p>
            <p className="mt-2 text-sm text-text-secondary">{t('Tags.emptyBody')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
