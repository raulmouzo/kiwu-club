"use client"

import { MinusIcon, PlusIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

// Segmented control: the chosen option is highlighted.
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
  fill,
}: {
  options: { value: T; label: string }[]
  value: T | undefined
  onChange: (value: T) => void
  className?: string
  fill?: boolean
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-foreground/8 p-1",
        fill && "w-full",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 touch-manipulation rounded-full px-7 text-[15px] font-medium",
              active
                ? "bg-card text-foreground shadow-[0_1px_3px_rgb(48_40_32/0.15)]"
                : "text-muted-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function Stepper({
  value,
  min = 1,
  max = 20,
  onChange,
  small,
  label,
}: {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  small?: boolean
  label: string
}) {
  const size = small ? "size-9" : "size-12"
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Remove one ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn(
          "grid touch-manipulation place-items-center rounded-full bg-foreground/10 disabled:opacity-40",
          size
        )}
      >
        <MinusIcon weight="bold" />
      </button>
      <span className="w-5 text-center text-lg font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Add one ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn(
          "grid touch-manipulation place-items-center rounded-full bg-foreground text-background disabled:opacity-40",
          size
        )}
      >
        <PlusIcon weight="bold" />
      </button>
    </div>
  )
}

export { Segmented, Stepper }
