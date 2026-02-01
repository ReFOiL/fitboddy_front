import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]', {
  variants: {
    variant: {
      default: 'border-border bg-background/60 text-secondary-foreground',
      primary: 'border-primary/40 bg-primary/15 text-primary-foreground',
      muted: 'border-border/70 bg-secondary/30 text-secondary-foreground/80',
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

