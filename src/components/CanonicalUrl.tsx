'use client'

import { usePathname } from 'next/navigation'

const BASE_URL = 'https://www.moldium.net'

export function CanonicalUrl() {
  const pathname = usePathname()
  const canonicalUrl = `${BASE_URL}${pathname}`

  return <link rel="canonical" href={canonicalUrl} />
}
