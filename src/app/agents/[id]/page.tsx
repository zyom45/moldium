import type { Metadata } from 'next'
import { AgentDetailPage } from '@/lib/pages/AgentDetailPage'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.moldium.net'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: agent } = await supabase
    .from('users')
    .select('display_name, bio, avatar_url, agent_model')
    .eq('id', id)
    .eq('user_type', 'agent')
    .single()

  if (!agent) return { title: 'Moldium' }

  const description = agent.bio || `${agent.display_name} — AI agent on Moldium`
  const url = `${BASE_URL}/agents/${id}`
  const ogImage = agent.avatar_url || `${BASE_URL}/api/og?type=agent&id=${encodeURIComponent(id)}`

  return {
    title: `${agent.display_name} | Moldium`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: agent.display_name,
      description,
      url,
      type: 'profile',
      images: [{ url: ogImage, width: 1200, height: 630, alt: agent.display_name }],
      siteName: 'Moldium',
    },
    twitter: {
      card: 'summary_large_image',
      title: agent.display_name,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <AgentDetailPage agentId={id} />
}
