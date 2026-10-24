"use client"


import { XIcon } from "@phosphor-icons/react"
import { useId } from "react"

import { Brand } from "@/components/brand"
import { lineCents, MAX_QUANTITY, type CartLine } from "@/components/kiosk/cart"
import { Segmented, Stepper } from "@/components/kiosk/controls"
import { SheetTitle } from "@/components/kiosk/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OrderType } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"

type Props = {
  cart: CartLine[]
  onChangeQuantity: (key: string, quantity: number) => void
  name: string
  onNameChange: (name: string) => void
  orderType: OrderType
  onOrderTypeChange: (type: OrderType) => void
  error: string | null
  pending: boolean
  onPlace: () => void
  // Set when the panel is shown inside a sheet instead of the side column.
  onClose?: () => void
}

export function OrderPanel({
  cart,
  onChangeQuantity,
  name,
  onNameChange,
  orderType,
  onOrderTypeChange,
  error,
  pending,
  onPlace,
  onClose,
}: Props) {
  const nameId = useId()
  const totalCents = cart.reduce((sum, line) => sum + lineCents(line), 0)
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const canOrder = cart.length > 0 && name.trim().length > 0 && !pending
  const Heading = onClose ? SheetTitle : "h2"

  return (
    <aside
      className={
        onClose
          ? "flex min-h-0 flex-col gap-5 overflow-y-auto p-6"
          : "flex flex-col gap-5 rounded-[2rem] bg-card p-6 shadow-[0_8px_32px_rgb(48_40_32/0.08)] lg:h-full lg:overflow-y-auto"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <Heading className="font-display text-2xl tracking-wide">Your order</Heading>
        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <span className="rounded-full bg-primary/12 px-3 py-1 text-sm font-medium text-primary tabular-nums">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              aria-label="Close order"
              onClick={onClose}
              className="grid size-10 touch-manipulation place-items-center rounded-full bg-foreground/8"
            >
              <XIcon weight="bold" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-24 flex-1 overflow-y-auto border-y border-border py-4">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Brand name="tumbadete" className="h-16 text-foreground/70" />
            <p>Nothing ordered yet</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {cart.map((line) => (
              <li key={line.key} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{line.product.name}</p>
                  {line.options.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {line.options.map((option) => option.name).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-medium tabular-nums">
                    {formatPrice(lineCents(line))}
                  </p>
                </div>
                <Stepper
                  small
                  min={0}
                  max={MAX_QUANTITY}
                  value={line.quantity}
                  label={line.product.name}
                  onChange={(quantity) => onChangeQuantity(line.key, quantity)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Name for the order</Label>
        <Input
          id={nameId}
          value={name}
          maxLength={40}
          placeholder="Your name"
          className="h-12 rounded-2xl bg-background px-4 text-base"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>

      <Segmented
        fill
        value={orderType}
        onChange={onOrderTypeChange}
        options={[
          { value: "dine_in", label: "Eat here" },
          { value: "takeaway", label: "Take away" },
        ]}
      />

      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Total
        </span>
        <span className="text-2xl font-semibold tabular-nums">
          {formatPrice(totalCents)}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button size="lg" className="h-14 text-lg" disabled={!canOrder} onClick={onPlace}>
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </aside>
  )
}
