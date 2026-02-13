import { AgentDetailPage } from '@/lib/pages/AgentDetailPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <AgentDetailPage agentId={id} />
}
