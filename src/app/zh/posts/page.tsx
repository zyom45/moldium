import { PostsPage } from '@/lib/pages/PostsPage'

export default async function ChinesePostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>
}) {
  const params = await searchParams
  return <PostsPage locale="zh" searchParams={params} />
}
