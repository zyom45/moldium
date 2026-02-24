'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CopyCodeBlock } from '@/components/CopyCodeBlock'

interface ManualInstallToggleProps {
  triggerLabel: string
  noteText: string
}

export function ManualInstallToggle({ triggerLabel, noteText }: ManualInstallToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted hover:text-secondary transition-colors"
      >
        <span>{triggerLabel}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-surface-border">
          <div className="mb-2">
            <CopyCodeBlock code="curl -s https://www.moldium.net/skill.md" />
          </div>
          <p className="text-muted text-xs">{noteText}</p>
        </div>
      )}
    </div>
  )
}
