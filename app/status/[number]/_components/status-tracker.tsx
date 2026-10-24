"use client"

import {
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  CoffeeIcon,
  PackageCheckIcon,
} from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"

import { CoffeeCup, DogSitting } from "@/components/brand"
import {
  getOrderStatusAction,
  type PublicOrderStatus,
} from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    key: "pending",
    title: "En cola",
    subtitle: "Comanda recibida en barra",
    icon: ClockIcon,
  },
  {
    key: "preparing",
    title: "Preparando",
    subtitle: "Moliendo y extrayendo tu café",
    icon: CoffeeIcon,
  },
  {
    key: "ready",
    title: "Listo",
    subtitle: "Pasa a recoger al mostrador",
    icon: PackageCheckIcon,
  },
]

export function StatusTracker({
  orderNumber,
  initialOrder,
}: {
  orderNumber: number
  initialOrder: PublicOrderStatus | null
}) {
  const [order, setOrder] = useState<PublicOrderStatus | null>(initialOrder)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  // Real-time polling every 3.5 seconds
  useEffect(() => {
    let active = true
    const interval = setInterval(async () => {
      try {
        const fresh = await getOrderStatusAction(orderNumber)
        if (active && fresh) {
          setOrder(fresh)
          setLastCheck(new Date())
        }
      } catch {
        // Ignore network drops
      }
    }, 3500)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [orderNumber])

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <DogSitting className="h-40 text-muted-foreground/40" />
        <h2 className="font-display text-2xl font-semibold">
          Pedido #{orderNumber} no encontrado
        </h2>
        <p className="text-sm text-muted-foreground">
          Comprueba el número en tu ticket o consulta a nuestro equipo en barra.
        </p>
      </div>
    )
  }

  const currentStepIndex =
    order.status === "completed"
      ? 3
      : order.status === "ready"
      ? 2
      : order.status === "preparing"
      ? 1
      : 0

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Top Hero Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2 rounded-[2.5rem] bg-card p-6 text-center shadow-soft"
      >
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Tu número de comanda
        </span>
        <h1 className="font-display text-7xl font-bold tracking-tight text-foreground sm:text-8xl">
          #{order.order_number}
        </h1>
        <p className="text-lg font-medium text-foreground/90">
          Hola, <span className="font-semibold text-primary">{order.customer_name}</span>
        </p>

        {order.table_number && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            📍 Mesa {order.table_number}
          </span>
        )}

        {order.status === "pending" && order.queue_ahead > 0 && (
          <p className="text-xs text-muted-foreground">
            {order.queue_ahead === 1
              ? "1 pedido por delante"
              : `${order.queue_ahead} pedidos por delante`}
          </p>
        )}
      </motion.div>

      {/* Main Status Timeline */}
      <div className="flex flex-col gap-4 rounded-[2.5rem] bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estado de preparación
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-2 animate-ping rounded-full bg-success" />
            En directo
          </span>
        </div>

        {/* 3-Step Interactive Timeline */}
        <div className="relative flex flex-col gap-6 py-2">
          {STEPS.map((step, idx) => {
            const isDone = currentStepIndex > idx
            const isCurrent = currentStepIndex === idx
            const Icon = step.icon

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Connecting Line */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-8 left-5 h-10 w-0.5 -translate-x-1/2 transition-colors duration-500",
                      currentStepIndex > idx ? "bg-primary" : "bg-border"
                    )}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                    isDone
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isCurrent
                      ? "border-2 border-primary bg-primary/15 text-primary shadow-lifted scale-110"
                      : "border border-border bg-muted/60 text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2Icon className="size-5" />
                  ) : (
                    <Icon className={cn("size-5", isCurrent && "animate-pulse")} />
                  )}
                </div>

                {/* Step Details */}
                <div className="flex flex-1 flex-col justify-center pt-0.5">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-base font-semibold",
                        isCurrent
                          ? "text-primary"
                          : isDone
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Big Alert when Ready */}
        {order.status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-3 rounded-2xl bg-success/15 p-4 text-success-foreground"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-success text-success-foreground">
              <PackageCheckIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold">¡Tu café está listo para recoger!</p>
              <p className="text-xs opacity-85">
                Acércate a la barra y muestra tu número #{order.order_number}.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Order Item List */}
      <div className="flex flex-col gap-3 rounded-[2.5rem] bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Productos en tu pedido
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">
            {formatPrice(order.total_cents)}
          </span>
        </div>

        <ul className="flex flex-col divide-y divide-border/60">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-start justify-between py-2.5 text-sm">
              <div>
                <p className="font-semibold text-foreground">
                  <span className="mr-1.5 font-bold text-primary">{item.quantity}×</span>
                  {item.name}
                </p>
                {item.options && item.options.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {item.options.join(", ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
