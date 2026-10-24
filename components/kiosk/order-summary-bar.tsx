"use client"

import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

// Always-visible order status for screens where the side panel is stacked
// below the menu. It updates as the guest orders and opens the full order.
export function OrderSummaryBar({
  itemCount,
  totalCents,
  onOpen,
}: {
  itemCount: number
  totalCents: number
  onOpen: () => void
}) {
  const empty = itemCount === 0

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto flex w-full max-w-xl touch-manipulation items-center justify-between gap-4 rounded-full bg-card/85 py-2 pr-2 pl-6 text-left shadow-[0_8px_32px_rgb(48_40_32/0.22)] ring-1 ring-foreground/8 backdrop-blur-xl"
      >
        <span>
          <span className={cn("block font-semibold", empty && "text-muted-foreground")}>
            {empty ? "Nothing ordered yet" : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          </span>
          <span className="block text-sm text-muted-foreground tabular-nums">
            {formatPrice(totalCents)}
          </span>
        </span>
        <span className="grid h-12 place-items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">
          {empty ? "Open order" : "View order"}
        </span>
      </button>
    </div>
  )
}
