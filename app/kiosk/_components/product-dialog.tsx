"use client"

import { XIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { Stepper } from "./controls"
import { Sheet, SheetDescription, SheetTitle } from "./sheet"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { Group, Option, Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

export type SelectedOption = Option & { groupName: string }

type Props = {
  product: Product | null
  onClose: () => void
  onAdd: (product: Product, options: SelectedOption[], quantity: number) => void
}

export function ProductDialog({ product, onClose, onAdd }: Props) {
  return (
    <Sheet
      open={product !== null}
      onOpenChange={(open) => !open && onClose()}
      className="top-1/2 left-1/2 max-h-[90svh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-card p-6 shadow-xl"
    >
      {product && (
        <ProductForm key={product.id} product={product} onAdd={onAdd} onClose={onClose} />
      )}
    </Sheet>
  )
}

// Required single-choice groups start on their first option so a plain
// order is one tap.
function initialSelection(product: Product) {
  const selection: Record<number, number[]> = {}
  for (const group of product.groups) {
    if (group.is_required && group.selection_type === "single" && group.options[0]) {
      selection[group.id] = [group.options[0].id]
    }
  }
  return selection
}

function ProductForm({
  product,
  onAdd,
  onClose,
}: {
  product: Product
  onAdd: Props["onAdd"]
  onClose: () => void
}) {
  const [selection, setSelection] = useState(() => initialSelection(product))
  const [quantity, setQuantity] = useState(1)

  function toggle(group: Group, option: Option) {
    setSelection((current) => {
      const chosen = current[group.id] ?? []
      if (group.selection_type === "single") {
        // Tapping the chosen option again clears it unless the group is required.
        const next = chosen[0] === option.id && !group.is_required ? [] : [option.id]
        return { ...current, [group.id]: next }
      }
      return {
        ...current,
        [group.id]: chosen.includes(option.id)
          ? chosen.filter((id) => id !== option.id)
          : [...chosen, option.id],
      }
    })
  }

  const selectedOptions: SelectedOption[] = product.groups.flatMap((group) =>
    group.options
      .filter((option) => selection[group.id]?.includes(option.id))
      .map((option) => ({ ...option, groupName: group.name }))
  )

  const missingRequired = product.groups.some(
    (group) => group.is_required && !(selection[group.id]?.length > 0)
  )

  const unitCents =
    product.price_cents +
    selectedOptions.reduce((sum, option) => sum + option.price_delta_cents, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SheetTitle className="font-display text-3xl">{product.name}</SheetTitle>
          {product.description && (
            <SheetDescription className="mt-1 text-sm text-muted-foreground">
              {product.description}
            </SheetDescription>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <XIcon />
        </Button>
      </div>

      {product.groups.map((group) => (
        <fieldset key={group.id} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{group.name}</legend>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const selected = selection[group.id]?.includes(option.id) ?? false
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(group, option)}
                  className={cn(
                    "h-10 touch-manipulation rounded-full border px-4 text-sm transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {option.name}
                  {option.price_delta_cents > 0 && ` +${formatPrice(option.price_delta_cents)}`}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center justify-between gap-4 pt-2">
        <Stepper value={quantity} onChange={setQuantity} label={product.name} />
        <Button
          size="lg"
          disabled={missingRequired}
          onClick={() => onAdd(product, selectedOptions, quantity)}
        >
          Add · {formatPrice(unitCents * quantity)}
        </Button>
      </div>
    </div>
  )
}
