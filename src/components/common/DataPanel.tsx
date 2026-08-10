import React from 'react'
import { cn } from '@/lib/utils'

interface DataPanelProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export function DataPanel({ title, description, children, className, headerAction }: DataPanelProps) {
  return (
    <div className={cn('rounded-card border border-hairline bg-near-black p-6 sm:p-8 flex flex-col text-white shadow-sm', className)}>
      {(title || description || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-hairline">
          <div>
            {title && <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{title}</h2>}
            {description && <p className="text-white/60 text-xs sm:text-sm mt-1">{description}</p>}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  )
}
