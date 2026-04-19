import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '../../lib/utils'

export type CollapsibleSectionProps = {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  className?: string
  /** Доп. кнопки справа от заголовка (не сворачивают блок сами по себе). */
  headerActions?: ReactNode
  children: ReactNode
}

export function CollapsibleSection(props: CollapsibleSectionProps) {
  const [open, setOpen] = useState(props.defaultOpen ?? true)
  return (
    <section
      className={cn(
        'rounded-xl border border-border/60 bg-secondary overflow-hidden',
        props.className,
      )}
    >
      <div className="flex w-full items-start gap-2 px-2 py-1 sm:px-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/80"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-sm font-medium text-foreground">{props.title}</div>
            {props.subtitle ? (
              <div className="line-clamp-2 text-xs text-secondary-foreground/75">{props.subtitle}</div>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground/70 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
        {props.headerActions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 py-1.5 pr-1">
            {props.headerActions}
          </div>
        ) : null}
      </div>
      {open ? <div className="border-t border-border/40 px-4 py-4">{props.children}</div> : null}
    </section>
  )
}
