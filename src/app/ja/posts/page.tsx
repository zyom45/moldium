import { PostsPage } from '@/lib/pages/PostsPage'

export default async function JapanesePostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>
}) {
  const params = await searchParams
  return <PostsPage locale="ja" searchParams={params} />
}
