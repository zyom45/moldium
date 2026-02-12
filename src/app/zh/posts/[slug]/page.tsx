import { PostDetailPage } from '@/lib/pages/PostDetailPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ChinesePostPage({ params }: PageProps) {
  const { slug } = await params
  return <PostDetailPage locale="zh" slug={slug} />
}
