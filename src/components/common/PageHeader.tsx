import React from 'react'
import { cn } from '@/lib/utils'

type PanelVariant = 'cream' | 'indigo' | 'pink' | 'dark'

const VARIANT_STYLES: Record<PanelVariant, { panel: string; title: string; desc: string }> = {
  cream: { panel: 'bg-cream text-black border border-black/10', title: 'text-black', desc: 'text-black/75' },
  indigo: { panel: 'bg-indigo text-white border border-white/10', title: 'text-white', desc: 'text-white/80' },
  pink: { panel: 'bg-pink text-black border border-black/10', title: 'text-black', desc: 'text-black/75' },
  dark: { panel: 'bg-near-black border border-hairline text-white', title: 'text-white', desc: 'text-white/60' },
}

interface PageHeaderProps {
  title: string
  description?: string
  variant?: PanelVariant
  action?: React.ReactNode
  filters?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  variant = 'dark',
  action,
  filters,
  className,
}: PageHeaderProps) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.dark

  return (
    <div className={cn('rounded-card p-6 lg:p-8 mb-6 relative overflow-hidden shadow-sm', styles.panel, className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-hairline/60 relative z-10">
        <div>
          <h1 className={cn('text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-none', styles.title)}>
            {title}
          </h1>
          {description && (
            <p className={cn('font-normal max-w-2xl text-sm leading-relaxed', styles.desc)}>{description}</p>
          )}
        </div>
        {action}
      </div>
      {filters && <div className="relative z-10">{filters}</div>}
    </div>
  )
}
