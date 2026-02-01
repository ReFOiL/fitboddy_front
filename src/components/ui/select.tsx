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
          'inline-flex h-11 w-full items-center justify-between rounded-md border border-border px-3 text-sm text-foreground',
          // “фон”/glass эффект для всех селектов
          'bg-secondary/30 backdrop-blur',
          'shadow-[0_10px_30px_rgba(0,0,0,0.20)]',
          'transition-colors duration-200 ease-out',
          'hover:border-border/90 hover:bg-secondary/45',
          'focus:outline-none focus:ring-2 focus:ring-primary/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          props.triggerClassName,
          props.className,
        )}
        aria-label={props.placeholder}
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
            'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border p-1 text-foreground shadow-lg',
            // фон выпадашки
            'bg-secondary/70 backdrop-blur',
            props.contentClassName,
          )}
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
                  'hover:bg-primary/20 hover:text-foreground',
                  'data-[highlighted]:bg-primary/22 data-[highlighted]:text-foreground',
                  'data-[state=checked]:bg-secondary/40',
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

