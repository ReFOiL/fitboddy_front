import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px]', {
  variants: {
    variant: {
      default: 'border-border/40 bg-transparent text-secondary-foreground',
      primary: 'border-primary/50 bg-transparent text-primary',
      muted: 'border-border/30 bg-transparent text-secondary-foreground/80',
      warning: 'border-warning/60 bg-transparent text-warning',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

