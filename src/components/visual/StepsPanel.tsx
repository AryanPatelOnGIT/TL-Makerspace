import * as React from 'react'
import { cn } from '@/lib/utils'

interface StepItem {
  title: string
  description: string
}

interface StepsPanelProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title: string
  steps: StepItem[]
  action?: React.ReactNode
}

const STEP_STYLES = ['bg-lime', 'bg-orange', 'bg-pink']

export function StepsPanel({ eyebrow, title, steps, action, className, ...props }: StepsPanelProps) {
  return (
    <section className={cn('rounded-card bg-tan p-3 text-white sm:p-5 lg:p-6', className)} {...props}>
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">{eyebrow}</p>}
      <div className="mt-2.5 flex flex-col gap-3 sm:mt-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="max-w-2xl text-[clamp(1.55rem,8vw,3rem)] font-extrabold leading-[0.95] tracking-normal text-white sm:tracking-[-0.04em] lg:tracking-[-0.06em]">
          {title}
        </h2>
        <div className="flex w-full shrink-0 items-start sm:w-auto">
          {action}
        </div>
      </div>
      <ol className="mt-4 grid gap-2.5 sm:mt-8 sm:gap-3 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className={cn('rounded-card p-3 sm:p-5 text-black', STEP_STYLES[index % STEP_STYLES.length])}>
            <span className="font-data text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em]">0{index + 1}</span>
            <h3 className="mt-2 text-lg font-extrabold leading-none tracking-normal text-black sm:mt-6 sm:text-2xl sm:tracking-[-0.04em]">{step.title}</h3>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium leading-relaxed text-black/65">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
