import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '../../lib/utils'

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: number | string | null
  onChange?: (value: number | '') => void
  min?: number
  max?: number
  step?: number
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      min,
      max,
      step = 1,
      disabled,
      onBlur,
      placeholder,
      ...props
    },
    ref
  ) => {
    const displayValue =
      value === undefined || value === null || value === '' ? '' : String(value)
    const numValue =
      value === undefined || value === null || value === ''
        ? NaN
        : Number(value)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (v === '') {
        onChange?.('')
        return
      }
      const n = Number(v)
      if (Number.isFinite(n)) onChange?.(n)
    }

    const increment = () => {
      const current = Number.isFinite(numValue) ? numValue : (min ?? 0)
      const next = current + step
      const clamped = max != null ? Math.min(next, max) : next
      onChange?.(clamped)
    }

    const decrement = () => {
      const current = Number.isFinite(numValue) ? numValue : (min ?? 0)
      const next = current - step
      const clamped = min != null ? Math.max(next, min) : next
      onChange?.(clamped)
    }

    return (
      <div
        className={cn(
          'flex h-11 w-full overflow-hidden rounded-md border border-border/40 text-sm',
          'bg-[var(--surface-control)]',
          'focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <input
          ref={ref}
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'min-w-0 flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-secondary-foreground/70',
            'disabled:cursor-not-allowed'
          )}
          {...props}
        />
        <div className="flex w-9 shrink-0 flex-col border-l border-border/50">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={increment}
            className={cn(
              'flex min-h-[22px] w-full flex-1 cursor-pointer select-none items-center justify-center border-0 p-0',
              'bg-[var(--surface-card)] text-foreground',
              'transition-[background-color,color,box-shadow] duration-200 ease-out',
              'hover:bg-[#0f2847] hover:text-[var(--accent)] hover:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)]',
              'active:bg-[#2a1a22] active:text-destructive active:shadow-[inset_0_0_0_1px_rgba(251,113,133,0.5)]',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
            aria-label="Увеличить"
          >
            <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          </button>
          <div className="h-px w-full shrink-0 bg-border/60" aria-hidden />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={decrement}
            className={cn(
              'flex min-h-[22px] w-full flex-1 cursor-pointer select-none items-center justify-center border-0 p-0',
              'bg-[var(--surface-card)] text-foreground',
              'transition-[background-color,color,box-shadow] duration-200 ease-out',
              'hover:bg-[#0f2847] hover:text-[var(--accent)] hover:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)]',
              'active:bg-[#2a1a22] active:text-destructive active:shadow-[inset_0_0_0_1px_rgba(251,113,133,0.5)]',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
            aria-label="Уменьшить"
          >
            <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    )
  }
)
NumberInput.displayName = 'NumberInput'
