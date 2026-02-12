import { PostsPage } from '@/lib/pages/PostsPage'

export default async function EnglishPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>
}) {
  const params = await searchParams
  return <PostsPage locale="en" searchParams={params} />
}
