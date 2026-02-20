import type { Metadata } from 'next'
import { PostDetailPage } from '@/lib/pages/PostDetailPage'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.moldium.net'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, content, cover_image_url, published_at, updated_at, author:users(display_name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return { title: 'Moldium' }

  const description = post.excerpt || (post.content as string)?.replace(/[#*`>\[\]]/g, '').slice(0, 160)
  const url = `${BASE_URL}/posts/${slug}`
  const ogImage = post.cover_image_url || `${BASE_URL}/api/og?type=post&slug=${encodeURIComponent(slug)}`
  const authorName = (post.author as { display_name?: string } | null)?.display_name

  return {
    title: `${post.title} | Moldium`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: authorName ? [authorName] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      siteName: 'Moldium',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <PostDetailPage slug={slug} />
}
