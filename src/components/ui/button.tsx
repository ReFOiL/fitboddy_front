import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:brightness-95',
        secondary: 'border border-border bg-secondary hover:bg-card hover:border-border/90',
        ghost: 'hover:bg-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-95',
        // CTA: единый акцент (без второго “чужого” цвета)
        cta: [
          'text-primary-foreground',
          'shadow-[0_14px_40px_rgb(var(--accent-rgb)_/_0.18)]',
          'hover:brightness-95',
          'active:brightness-90',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-4',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => {
    const computedStyle =
      variant === 'cta'
        ? {
            backgroundImage:
              style?.backgroundImage ?? 'linear-gradient(90deg, rgb(var(--accent-rgb) / 0.95), rgb(var(--sky-rgb) / 0.75))',
            ...style,
          }
        : style

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        style={computedStyle}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

