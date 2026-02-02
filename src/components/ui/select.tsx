import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '../../lib/utils'

export type SelectOption = { value: string; label: string }

export function SelectField(props: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
}) {
  return (
    <SelectPrimitive.Root value={props.value} onValueChange={props.onValueChange} disabled={props.disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex h-11 w-full items-center justify-between rounded-md border border-border/40 px-3 text-sm text-foreground',
          // непрозрачная поверхность
          'bg-control',
          'shadow-[0_10px_26px_rgba(0,0,0,0.30)]',
          'transition-colors duration-200 ease-out',
          'hover:border-border/60 hover:bg-control',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          props.triggerClassName,
          props.className,
        )}
        aria-label={props.placeholder}
        style={{ backgroundColor: 'var(--surface-control)' }}
      >
        <SelectPrimitive.Value placeholder={props.placeholder} />
        <SelectPrimitive.Icon className="text-secondary-foreground/70 transition-colors duration-200">
          <ChevronDown className="h-4 w-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border/40 p-1 text-foreground shadow-lg',
            // фон выпадашки (непрозрачный)
            'bg-card',
            props.contentClassName,
          )}
          style={{ backgroundColor: 'var(--surface-popover)' }}
        >
          <SelectPrimitive.Viewport className="p-1">
            {props.options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
                  'transition-colors duration-150',
                  // заметный hover/highlight
                  'hover:bg-secondary hover:text-foreground',
                  'data-[highlighted]:bg-secondary data-[highlighted]:text-foreground',
                  'data-[state=checked]:bg-secondary',
                )}
              >
                <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

// Backwards-compat alias (старый импорт `Select`), теперь это стилизованный Radix Select.
export const Select = SelectField

