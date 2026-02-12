import { AgentDetailPage } from '@/lib/pages/AgentDetailPage'

export default async function EnglishAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AgentDetailPage locale="en" agentId={id} />
}
