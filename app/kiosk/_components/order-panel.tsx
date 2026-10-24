"use client"

import {
  Clock,
  Tag,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useId, useState } from "react"

import { cartTotals, lineCents, MAX_QUANTITY, type CartLine } from "./cart"
import { Segmented, Stepper } from "./controls"
import { Price } from "./price"
import { SheetTitle } from "./sheet"
import { DogLying } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OrderType } from "@/lib/actions/orders"
import { validateDiscountCodeAction } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]

const TIPS = [
  { label: "0€", cents: 0 },
  { label: "0.50€", cents: 50 },
  { label: "1.00€", cents: 100 },
  { label: "2.00€", cents: 200 },
]

type Props = {
  cart: CartLine[]
  onChangeQuantity: (key: string, quantity: number) => void
  name: string
  onNameChange: (name: string) => void
  orderType: OrderType
  onOrderTypeChange: (type: OrderType) => void
  tableNumber: number
  onTableNumberChange: (table: number) => void
  pickupTime: string
  onPickupTimeChange: (time: string) => void
  tipCents: number
  onTipChange: (cents: number) => void
  discountCode: string
  onDiscountCodeChange: (code: string) => void
  discountCents: number
  onDiscountCentsChange: (cents: number) => void
  estimatedWaitMinutes: number
  error: string | null
  pending: boolean
  onStartPayment: () => void
  onClose?: () => void
}

export function OrderPanel({
  cart,
  onChangeQuantity,
  name,
  onNameChange,
  orderType,
  onOrderTypeChange,
  tableNumber,
  onTableNumberChange,
  pickupTime,
  onPickupTimeChange,
  tipCents,
  onTipChange,
  discountCode,
  onDiscountCodeChange,
  discountCents,
  onDiscountCentsChange,
  estimatedWaitMinutes,
  error,
  pending,
  onStartPayment,
  onClose,
}: Props) {
  const nameId = useId()
  const discountId = useId()

  const { itemCount, totalCents: subtotalCents } = cartTotals(cart)
  const finalTotalCents = Math.max(0, subtotalCents + tipCents - discountCents)
  const canOrder = cart.length > 0 && name.trim().length > 0 && !pending

  const [discountMsg, setDiscountMsg] = useState<string | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return
    setValidatingCode(true)
    setDiscountMsg(null)
    try {
      const res = await validateDiscountCodeAction(discountCode, subtotalCents)
      if (res.ok) {
        onDiscountCentsChange(res.discountCents)
        setDiscountMsg(`Promo applied: -${formatPrice(res.discountCents)}`)
      } else {
        onDiscountCentsChange(0)
        setDiscountMsg(res.message || "Invalid promo code")
      }
    } finally {
      setValidatingCode(false)
    }
  }

  const Heading = onClose ? SheetTitle : "h2"

  return (
    <aside
      className={
        onClose
          ? "flex min-h-0 flex-col gap-5 overflow-y-auto p-6"
          : "flex flex-col gap-5 rounded-[2.5rem] bg-card p-6 shadow-soft lg:h-full lg:overflow-y-auto"
      }
    >
      {/* Header with Title & Live wait time */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <Heading className="font-display text-2xl tracking-wide">
            Your order
          </Heading>
          {estimatedWaitMinutes > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Clock className="size-3.5 animate-pulse" />
              ~{estimatedWaitMinutes} min wait
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence initial={false}>
            {itemCount > 0 && (
              <motion.span
                key="count"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary tabular-nums"
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
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart items list */}
      <div className="min-h-24 flex-1 overflow-y-auto border-y border-border py-3">
        {cart.length === 0 ? (
          <div className="flex h-full animate-in flex-col items-center justify-center gap-3 py-6 text-muted-foreground duration-500 fade-in-0">
            <DogLying className="h-16 text-foreground/60" />
            <p className="text-sm font-medium">Nothing ordered yet</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
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
                  <div className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{line.product.name}</p>
                      {line.options.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {line.options.map((option) => option.name).join(", ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-medium text-foreground/90">
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

      {/* Customer Name Input (Clean, simple, no emojis/avatar buttons) */}
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Name for the order
        </Label>
        <Input
          id={nameId}
          value={name}
          maxLength={40}
          placeholder="Your name"
          className="h-12 rounded-2xl bg-background px-4 text-base shadow-inner-soft"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>

      {/* Dine-in vs Takeaway Toggle */}
      <div className="flex flex-col gap-2">
        <Segmented
          fill
          value={orderType}
          onChange={onOrderTypeChange}
          options={[
            { value: "dine_in", label: "Eat here" },
            { value: "takeaway", label: "Take away" },
          ]}
        />

        {orderType === "dine_in" ? (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              Table number:
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {TABLES.map((tNum) => (
                <button
                  key={tNum}
                  type="button"
                  onClick={() => onTableNumberChange(tNum)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all active:scale-95",
                    tableNumber === tNum
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {tNum}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              Pickup time:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "now", label: "Right now" },
                { val: "10m", label: "In 10 min" },
                { val: "20m", label: "In 20 min" },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => onPickupTimeChange(p.val)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-xl border text-xs font-medium transition-all active:scale-95",
                    pickupTime === p.val
                      ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Extras (Tip, Promo Code) */}
      <div className="border-t border-border pt-2">
        <button
          type="button"
          onClick={() => setShowExtras(!showExtras)}
          className="flex w-full items-center justify-between py-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>{showExtras ? "— Hide tip and promo code" : "+ Add tip or promo code"}</span>
          <span className="text-xs text-muted-foreground">
            {discountCents > 0 || tipCents > 0 ? "Active" : ""}
          </span>
        </button>

        {showExtras && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4 pt-3"
          >
            {/* Barista Tip */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Tip for the barista:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {TIPS.map((tp) => (
                  <button
                    key={tp.cents}
                    type="button"
                    onClick={() => onTipChange(tp.cents)}
                    className={cn(
                      "h-8 rounded-xl border text-xs font-medium transition-all",
                      tipCents === tp.cents
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    )}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Promo Code */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={discountId} className="text-xs font-medium text-muted-foreground">
                Promo code (e.g. KIWU10):
              </Label>
              <div className="flex gap-2">
                <Input
                  id={discountId}
                  value={discountCode}
                  placeholder="KIWU10"
                  className="h-10 rounded-xl bg-background px-3 text-sm uppercase"
                  onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl px-4 text-xs font-semibold"
                  disabled={validatingCode || !discountCode.trim()}
                  onClick={handleApplyDiscount}
                >
                  <Tag className="size-3.5 mr-1" />
                  Apply
                </Button>
              </div>
              {discountMsg && (
                <p className={cn("text-xs font-medium", discountCents > 0 ? "text-success" : "text-destructive")}>
                  {discountMsg}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        {discountCents > 0 && (
          <div className="flex items-baseline justify-between text-xs text-success">
            <span>Discount</span>
            <span>-{formatPrice(discountCents)}</span>
          </div>
        )}
        {tipCents > 0 && (
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>Tip</span>
            <span>+{formatPrice(tipCents)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            Total
          </span>
          <span className="font-display text-3xl font-bold tracking-tight text-foreground">
            <Price cents={finalTotalCents} />
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive font-medium">
          {error}
        </p>
      )}

      {/* Main Order & Pay Button */}
      <Button
        size="lg"
        className="h-14 rounded-2xl text-lg font-semibold shadow-lifted active:scale-[0.98]"
        disabled={!canOrder}
        onClick={onStartPayment}
      >
        {pending ? "Placing order…" : "Pay and order"}
      </Button>
    </aside>
  )
}
