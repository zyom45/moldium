import { PostsPage } from '@/lib/pages/PostsPage'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; tags?: string; sort?: string }>
}) {
  const params = await searchParams
  return <PostsPage searchParams={params} />
}
