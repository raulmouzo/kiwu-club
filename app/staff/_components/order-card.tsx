"use client"

import { XIcon } from "@phosphor-icons/react"
import { useTransition } from "react"

import { Elapsed } from "./elapsed"
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm"
import { ActionButton } from "@/components/action-button"
import { updateOrderStatus, type OrderStatus } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import type { ActiveOrder } from "@/lib/orders"

const NEXT: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }>
> = {
  pending: { status: "preparing", label: "Start" },
  preparing: { status: "ready", label: "Mark ready" },
  ready: { status: "completed", label: "Hand over" },
}

export function OrderCard({ order }: { order: ActiveOrder }) {
  const next = NEXT[order.status]
  const [cancelling, startCancel] = useTransition()

  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl leading-none">
            #{order.order_number}
          </p>
          <p className="mt-1.5 font-semibold">{order.customer_name}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>{order.order_type === "dine_in" ? "Eat here" : "Take away"}</p>
          <Elapsed since={order.created_at} />
        </div>
      </header>

      <ul className="flex flex-col gap-2 border-y border-border py-3">
        {order.order_items.map((item) => (
          <li key={item.id}>
            <p className="font-medium">
              {item.quantity}× {item.product_name}
            </p>
            {item.order_item_options.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {item.order_item_options
                  .map((option) => option.option_name)
                  .join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatPrice(order.total_cents)}
        </span>
        <div className="flex items-center gap-2">
          {/* Cancelling cannot be undone, so it takes a short hold, not a tap. */}
          {order.status !== "ready" && (
            <HoldToConfirm
              tone="danger"
              label="Hold to cancel"
              confirmedLabel="Cancelled"
              icon={<XIcon weight="bold" />}
              disabled={cancelling}
              onConfirm={() =>
                startCancel(() => updateOrderStatus(order.id, "cancelled"))
              }
            />
          )}
          {next && (
            <ActionButton
              size="lg"
              className="h-11 px-5 active:scale-[0.97]"
              action={updateOrderStatus.bind(null, order.id, next.status)}
            >
              {next.label}
            </ActionButton>
          )}
        </div>
      </footer>
    </article>
  )
}
