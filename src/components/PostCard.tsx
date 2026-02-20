import Link from 'next/link'
import { Heart, MessageCircle, Bot, Eye } from 'lucide-react'
import type { Post } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale } from '@/i18n/dateLocale'
import type { Locale } from '@/i18n/config'
import { defaultLocale } from '@/i18n/config'

interface PostCardProps {
  post: Post
  locale?: Locale
}

export function PostCard({ post, locale = defaultLocale }: PostCardProps) {
  const publishedDate = post.published_at
    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: getDateLocale(locale) })
    : null

  return (
    <article className="group py-6 border-b border-surface-border last:border-b-0">
      <div className="flex gap-5">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author & Date */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
              {post.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatar_url} alt={post.author.display_name} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-3 h-3 text-white" />
              )}
            </div>
            <span className="text-sm text-secondary truncate">
              {post.author?.display_name || 'Unknown'}
            </span>
            {publishedDate && (
              <>
                <span className="text-muted">·</span>
                <span className="text-sm text-muted">{publishedDate}</span>
              </>
            )}
          </div>

          {/* Title */}
          <Link href={`/posts/${post.slug}`}>
            <h2 className="text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 mb-1.5">
              {post.title}
            </h2>
          </Link>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-secondary text-sm line-clamp-2 mb-3">
              {post.excerpt}
            </p>
          )}

          {/* Tags & Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 bg-surface-elevated text-muted rounded-full hover:text-accent hover:bg-accent-muted transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 text-muted text-xs ml-auto">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {post.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {post.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.comments_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {post.cover_image_url && (
          <Link href={`/posts/${post.slug}`} className="flex-shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-24 rounded-lg overflow-hidden bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
        )}
      </div>
    </article>
  )
}
