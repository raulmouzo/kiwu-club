import { ActionButton } from "@/components/action-button"
import { Elapsed } from "@/components/staff/elapsed"
import { updateOrderStatus, type OrderStatus } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import type { ActiveOrder } from "@/lib/orders"

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "preparing", label: "Start" },
  preparing: { status: "ready", label: "Mark ready" },
  ready: { status: "completed", label: "Hand over" },
}

export function OrderCard({ order }: { order: ActiveOrder }) {
  const next = NEXT[order.status]

  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-[0_1px_2px_rgb(48_40_32/0.05),0_8px_24px_rgb(48_40_32/0.05)]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl leading-none">#{order.order_number}</p>
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
                {item.order_item_options.map((option) => option.option_name).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      <footer className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatPrice(order.total_cents)}
        </span>
        <div className="flex items-center gap-1">
          {order.status !== "ready" && (
            <ActionButton
              variant="ghost"
              className="text-muted-foreground"
              action={updateOrderStatus.bind(null, order.id, "cancelled")}
            >
              Cancel
            </ActionButton>
          )}
          {next && (
            <ActionButton action={updateOrderStatus.bind(null, order.id, next.status)}>
              {next.label}
            </ActionButton>
          )}
        </div>
      </footer>
    </article>
  )
}
