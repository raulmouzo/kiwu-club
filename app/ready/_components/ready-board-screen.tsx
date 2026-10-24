"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { playOrderBell } from "@/lib/audio"
import type { ActiveOrder } from "@/lib/orders"

export function ReadyBoardScreen({
  initialOrders,
}: {
  initialOrders: ActiveOrder[]
}) {
  const [orders, setOrders] = useState<ActiveOrder[]>(initialOrders)

  useEffect(() => {
    let active = true
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders/active")
        if (res.ok) {
          const fresh: ActiveOrder[] = await res.json()
          if (active) {
            // Check if any order newly moved to "ready"
            const prevReadyIds = new Set(
              orders.filter((o) => o.status === "ready").map((o) => o.id)
            )
            const newlyReady = fresh.find(
              (o) => o.status === "ready" && !prevReadyIds.has(o.id)
            )
            if (newlyReady) {
              playOrderBell()
            }
            setOrders(fresh)
          }
        }
      } catch {
        // Ignore
      }
    }, 4000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [orders])

  const preparing = orders.filter((o) => o.status === "preparing" || o.status === "pending")
  const ready = orders.filter((o) => o.status === "ready")

  return (
    <div className="grid flex-1 items-start gap-8 lg:grid-cols-2">
      {/* Column: Preparando */}
      <section className="flex flex-col gap-6 rounded-3xl border border-stone-800 bg-stone-900/60 p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="size-3.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-2xl font-bold tracking-tight text-amber-400 uppercase">
              Preparando
            </h2>
          </div>
          <span className="font-mono text-sm text-stone-400">
            {preparing.length} {preparing.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        {preparing.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            No hay comandas pendientes
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <AnimatePresence>
              {preparing.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-stone-800 bg-stone-950/80 p-5 text-center"
                >
                  <span className="font-display text-5xl font-bold tracking-tight text-stone-200">
                    #{order.order_number}
                  </span>
                  <span className="mt-1 text-xs font-medium text-stone-400 truncate max-w-full">
                    {order.customer_name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Column: ¡Listo! */}
      <section className="flex flex-col gap-6 rounded-3xl border border-emerald-900/50 bg-emerald-950/20 p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="size-3.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-2xl font-bold tracking-tight text-emerald-400 uppercase">
              ¡Listo para recoger!
            </h2>
          </div>
          <span className="font-mono text-sm text-emerald-300">
            {ready.length} listos
          </span>
        </div>

        {ready.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            Los pedidos listos aparecerán aquí
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <AnimatePresence>
              {ready.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative overflow-hidden flex flex-col items-center justify-center rounded-3xl border-2 border-emerald-500/60 bg-emerald-900/30 p-8 text-center shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                >
                  <span className="font-display text-7xl font-extrabold tracking-tight text-emerald-300 sm:text-8xl">
                    #{order.order_number}
                  </span>
                  <span className="mt-2 text-base font-semibold text-emerald-100 truncate max-w-full">
                    {order.customer_name}
                  </span>
                  {order.table_number && (
                    <span className="mt-1 text-xs font-semibold text-emerald-400">
                      Mesa {order.table_number}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}
