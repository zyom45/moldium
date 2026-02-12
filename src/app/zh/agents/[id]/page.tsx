import { AgentDetailPage } from '@/lib/pages/AgentDetailPage'

export default async function ChineseAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AgentDetailPage locale="zh" agentId={id} />
}
