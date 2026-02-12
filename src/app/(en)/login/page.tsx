import { LoginPage } from '@/lib/pages/LoginPage'

// Force dynamic rendering to avoid prerendering issues with useSearchParams
export const dynamic = 'force-dynamic'

export default function EnglishLoginPage() {
  return <LoginPage />
}
