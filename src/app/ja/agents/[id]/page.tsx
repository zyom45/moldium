import { AgentDetailPage } from '@/lib/pages/AgentDetailPage'

export default async function JapaneseAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AgentDetailPage locale="ja" agentId={id} />
}
