"use client"

import { XIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useId } from "react"

import { cartTotals, lineCents, MAX_QUANTITY, type CartLine } from "./cart"
import { Segmented, Stepper } from "./controls"
import { Price } from "./price"
import { SheetTitle } from "./sheet"
import { DogLying } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OrderType } from "@/lib/actions/orders"

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
  const { itemCount, totalCents } = cartTotals(cart)
  const canOrder = cart.length > 0 && name.trim().length > 0 && !pending
  const Heading = onClose ? SheetTitle : "h2"

  return (
    <aside
      className={
        onClose
          ? "flex min-h-0 flex-col gap-5 overflow-y-auto p-6"
          : "flex flex-col gap-5 rounded-[2rem] bg-card p-6 shadow-soft lg:h-full lg:overflow-y-auto"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <Heading className="font-display text-2xl tracking-wide">
          Your order
        </Heading>
        <div className="flex items-center gap-2">
          <AnimatePresence initial={false}>
            {itemCount > 0 && (
              <motion.span
                key="count"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full bg-primary/12 px-3 py-1 text-sm font-medium text-primary tabular-nums"
              >
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </motion.span>
            )}
          </AnimatePresence>
          {onClose && (
            <button
              type="button"
              aria-label="Close order"
              onClick={onClose}
              className="grid size-10 touch-manipulation place-items-center rounded-full bg-foreground/8 transition-transform active:scale-90"
            >
              <XIcon weight="bold" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-24 flex-1 overflow-y-auto border-y border-border py-4">
        {cart.length === 0 ? (
          <div className="flex h-full animate-in flex-col items-center justify-center gap-3 text-muted-foreground duration-500 fade-in-0">
            <DogLying className="h-16 text-foreground/70" />
            <p>Nothing ordered yet</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {/* Lines grow in and collapse out, so the list never jumps. */}
            <AnimatePresence initial={false}>
              {cart.map((line) => (
                <motion.li
                  key={line.key}
                  layout="position"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    type: "spring",
                    bounce: 0,
                    visualDuration: 0.35,
                  }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{line.product.name}</p>
                      {line.options.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {line.options.map((option) => option.name).join(", ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-medium">
                        <Price cents={lineCents(line)} />
                      </p>
                    </div>
                    <Stepper
                      small
                      min={0}
                      max={MAX_QUANTITY}
                      value={line.quantity}
                      label={line.product.name}
                      onChange={(quantity) =>
                        onChangeQuantity(line.key, quantity)
                      }
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
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
        <span className="text-2xl font-semibold">
          <Price cents={totalCents} />
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="h-14 text-lg active:scale-[0.98]"
        disabled={!canOrder}
        onClick={onPlace}
      >
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </aside>
  )
}
