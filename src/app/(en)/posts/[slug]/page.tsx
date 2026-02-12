import { PostDetailPage } from '@/lib/pages/PostDetailPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function EnglishPostPage({ params }: PageProps) {
  const { slug } = await params
  return <PostDetailPage locale="en" slug={slug} />
}
