import React from 'react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
  tone?: 'light' | 'dark'
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-full font-bold tracking-wide text-xs transition-all duration-150 select-none',
        active
          ? 'bg-lime text-black shadow-sm'
          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-hairline'
      )}
    >
      {label}
    </button>
  )
}
