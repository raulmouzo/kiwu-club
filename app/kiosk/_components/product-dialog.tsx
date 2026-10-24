"use client"

import { XIcon } from "@phosphor-icons/react"
import { AlertCircle, Flame, Leaf, Milk, Snowflake, Wheat } from "lucide-react"
import { useState } from "react"

import { Stepper } from "./controls"
import { Price } from "./price"
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
      className="top-1/2 left-1/2 max-h-[90svh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-card p-6 shadow-lifted"
    >
      {product && (
        <ProductForm
          key={product.id}
          product={product}
          onAdd={onAdd}
          onClose={onClose}
        />
      )}
    </Sheet>
  )
}

// Required single-choice groups start on their first option so a plain
// order is one tap.
function initialSelection(product: Product) {
  const selection: Record<number, number[]> = {}
  for (const group of product.groups) {
    if (
      group.is_required &&
      group.selection_type === "single" &&
      group.options[0]
    ) {
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
        const next =
          chosen[0] === option.id && !group.is_required ? [] : [option.id]
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
          <SheetTitle className="font-display text-3xl">
            {product.name}
          </SheetTitle>
          {product.description && (
            <SheetDescription className="mt-1 text-sm text-muted-foreground">
              {product.description}
            </SheetDescription>
          )}

          {/* Dietary tags */}
          {product.dietary && product.dietary.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {product.dietary.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize"
                >
                  {d === "vegan" && (
                    <>
                      <Leaf className="size-3" />
                      <span>Vegan</span>
                    </>
                  )}
                  {d === "vegetarian" && (
                    <span>Vegetarian</span>
                  )}
                  {d === "lactose_free" && (
                    <>
                      <Milk className="size-3" />
                      <span>Lactose-free</span>
                    </>
                  )}
                  {d === "gluten_free" && (
                    <>
                      <Wheat className="size-3" />
                      <span>Gluten-free</span>
                    </>
                  )}
                  {d === "cold" && (
                    <>
                      <Snowflake className="size-3" />
                      <span>Cold</span>
                    </>
                  )}
                  {d === "hot" && (
                    <>
                      <Flame className="size-3" />
                      <span>Hot</span>
                    </>
                  )}
                  {!["vegan", "vegetarian", "lactose_free", "gluten_free", "cold", "hot"].includes(d) && (
                    <span>{d}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Allergens warning */}
          {product.allergens && product.allergens.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700/90 dark:text-amber-400">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>Allergens: {product.allergens.join(", ")}</span>
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={onClose}
        >
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
                    "h-11 touch-manipulation rounded-full border px-4 text-sm transition-[color,background-color,border-color,scale] duration-200 active:scale-95",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {option.name}
                  {option.price_delta_cents > 0 &&
                    ` +${formatPrice(option.price_delta_cents)}`}
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
          className="h-12 px-6 text-base active:scale-[0.97]"
          disabled={missingRequired}
          onClick={() => onAdd(product, selectedOptions, quantity)}
        >
          Add · <Price cents={unitCents * quantity} />
        </Button>
      </div>
    </div>
  )
}
