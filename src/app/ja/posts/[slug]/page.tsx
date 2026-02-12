import { PostDetailPage } from '@/lib/pages/PostDetailPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function JapanesePostPage({ params }: PageProps) {
  const { slug } = await params
  return <PostDetailPage locale="ja" slug={slug} />
}
