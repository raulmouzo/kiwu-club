"use client"

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
} from "motion/react"
import { useState } from "react"

import { OrderCard } from "./order-card"
import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter"
import Toast from "@/components/arc/toast/toast"
import { DogLying } from "@/components/brand"
import type { OrderStatus } from "@/lib/actions/orders"
import type { ActiveOrder } from "@/lib/orders"
import { cn } from "@/lib/utils"

const COLUMNS: { status: OrderStatus; title: string; dot: string }[] = [
  { status: "pending", title: "New", dot: "bg-primary" },
  { status: "preparing", title: "Preparing", dot: "bg-[#d5c4a8]" },
  { status: "ready", title: "Ready", dot: "bg-success" },
]

const MOVE = { type: "spring", bounce: 0, visualDuration: 0.45 } as const

// Three columns of orders. A card keeps its identity across columns, so when
// its status changes it travels to the next column instead of popping there.
export function OrderBoard({ orders }: { orders: ActiveOrder[] }) {
  const [toast, setToast] = useArrivalToast(orders)

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnOrders = orders.filter(
              (order) => order.status === column.status
            )
            return (
              <section key={column.status} className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 px-1 font-semibold">
                  {/* The dot is the column's status colour, matching the card it holds. */}
                  <span
                    aria-hidden
                    className={cn("size-2.5 rounded-full", column.dot)}
                  />
                  {column.title}
                  <span className="counter-inherit text-muted-foreground">
                    <AnimatedCounter value={columnOrders.length} />
                  </span>
                </h2>

                <AnimatePresence initial={false} mode="popLayout">
                  {columnOrders.length === 0 ? (
                    <motion.div
                      key="empty"
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: 0.2 } }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-foreground/15 py-10 text-sm text-muted-foreground"
                    >
                      <DogLying
                        className="h-10 text-foreground/50"
                      />
                      No orders
                    </motion.div>
                  ) : (
                    columnOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layoutId={order.id}
                        layout
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0.94,
                          transition: { duration: 0.2 },
                        }}
                        transition={MOVE}
                      >
                        <OrderCard order={order} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </section>
            )
          })}
        </div>
      </LayoutGroup>

      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-end [&>*]:pointer-events-auto">
        <Toast
          open={toast?.open ?? false}
          onOpenChange={(open) =>
            setToast((current) => current && { ...current, open })
          }
          title={toast ? `New order #${toast.order.order_number}` : ""}
          description={toast?.order.customer_name}
        />
      </div>
    </MotionConfig>
  )
}

// Raises a toast for the newest order that arrives after the board is first
// shown; orders already there on load are not announced. The order stays in
// state after the toast closes so its text holds during the exit.
function useArrivalToast(orders: ActiveOrder[]) {
  const [previous, setPrevious] = useState(orders)
  const [toast, setToast] = useState<{
    order: ActiveOrder
    open: boolean
  } | null>(null)

  if (orders !== previous) {
    const seen = new Set(previous.map((order) => order.id))
    const fresh = orders.filter((order) => !seen.has(order.id)).at(-1)
    if (fresh) setToast({ order: fresh, open: true })
    setPrevious(orders)
  }

  return [toast, setToast] as const
}
