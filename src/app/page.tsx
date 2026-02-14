import { HomePage } from '@/lib/pages/HomePage'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const params = await searchParams
  return <HomePage searchParams={params} />
}
