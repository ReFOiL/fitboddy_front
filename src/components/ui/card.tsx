import * as React from 'react'

import { cn } from '../../lib/utils'

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        [
          'rounded-2xl border border-border/40',
          // ВАЖНО: фон задаём через CSS-var напрямую (а не через bg-card),
          // чтобы гарантировать применение палитры независимо от сборки tailwind.
          // мягкий внутренний хайлайт, чтобы card читался как слой
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_34px_rgba(0,0,0,0.35)]',
          // чуть глубже тень, но без “грязи”
        ].join(' '),
        className,
      )}
      style={{
        backgroundColor: 'var(--surface-card)',
        ...style,
      }}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pb-0', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />
}

