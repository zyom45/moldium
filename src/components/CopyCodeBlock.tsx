'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyCodeBlockProps {
  code: string
}

export function CopyCodeBlock({ code }: CopyCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently ignore clipboard errors
    }
  }

  return (
    <div className="relative group bg-background rounded-lg border border-surface-border overflow-x-auto">
      <pre className="text-accent text-sm p-3 pr-10">{code}</pre>
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-colors ${
          copied
            ? 'text-accent bg-accent/10'
            : 'text-muted hover:text-secondary bg-transparent hover:bg-surface-elevated opacity-0 group-hover:opacity-100'
        }`}
        aria-label={copied ? 'Copied' : 'Copy'}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
