"use client"

import { XIcon } from "@phosphor-icons/react"
import { Printer } from "lucide-react"
import { useState, useTransition } from "react"

import Link from "next/link"
import { Elapsed } from "./elapsed"
import { ReceiptModal } from "./receipt-modal"
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm"
import { ActionButton } from "@/components/action-button"
import { updateOrderStatus, type OrderStatus } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import type { ActiveOrder } from "@/lib/orders"
import { cn } from "@/lib/utils"

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
  const [showReceipt, setShowReceipt] = useState(false)

  // Calculate order age in minutes
  const ageMinutes = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / 60000
  )

  const isUrgent = ageMinutes >= 8
  const isWarning = ageMinutes >= 4 && ageMinutes < 8

  return (
    <>
      <article
        className={cn(
          "flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft border transition-colors",
          isUrgent
            ? "border-rose-500/60 bg-rose-500/[0.04]"
            : isWarning
            ? "border-amber-500/50 bg-amber-500/[0.03]"
            : "border-border/60"
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/status/${order.order_number}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open live order tracker"
                className="font-display text-3xl leading-none hover:text-primary hover:underline transition-colors"
              >
                #{order.order_number}
              </Link>
              {isUrgent && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 uppercase">
                  Delayed
                </span>
              )}
            </div>
            <p className="mt-1.5 font-semibold text-foreground">{order.customer_name}</p>
          </div>

          <div className="text-right text-sm text-muted-foreground flex flex-col items-end">
            <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {order.order_type === "dine_in"
                ? `Table ${order.table_number ?? 1}`
                : "Take away"}
            </span>
            <div className="mt-1 text-xs">
              <Elapsed since={order.created_at} />
            </div>
          </div>
        </header>

        <ul className="flex flex-col gap-2 border-y border-border/80 py-3">
          {order.order_items.map((item) => (
            <li key={item.id}>
              <p className="font-semibold text-foreground">
                <span className="text-primary font-bold mr-1">{item.quantity}×</span>
                {item.product_name}
              </p>
              {item.order_item_options.length > 0 && (
                <p className="text-xs text-muted-foreground pl-4">
                  {item.order_item_options
                    .map((option) => option.option_name)
                    .join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>

        <footer className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {formatPrice(order.total_cents)}
            </span>
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              aria-label="Print receipt"
              title="Print receipt ticket"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Printer className="size-4" />
            </button>
          </div>

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
                className="h-11 px-5 font-semibold active:scale-[0.97]"
                action={updateOrderStatus.bind(null, order.id, next.status)}
              >
                {next.label}
              </ActionButton>
            )}
          </div>
        </footer>
      </article>

      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={{
          orderNumber: order.order_number,
          customerName: order.customer_name,
          orderType: order.order_type,
          tableNumber: order.table_number,
          createdAt: order.created_at,
          totalCents: order.total_cents,
          tipCents: order.tip_cents ?? 0,
          discountCents: order.discount_cents ?? 0,
          items: order.order_items.map((i) => ({
            name: i.product_name,
            quantity: i.quantity,
            options: i.order_item_options.map((o) => o.option_name),
          })),
        }}
      />
    </>
  )
}
