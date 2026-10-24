"use client"

import {
  Banknote,
  Coffee,
  HeartHandshake,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react"

import type { SalesAnalytics } from "@/lib/actions/analytics"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export function SalesDashboard({ stats }: { stats: SalesAnalytics }) {
  const maxHourlyCount = Math.max(
    1,
    ...stats.hourlySales.map((h) => h.orderCount)
  )

  const maxProductQty = Math.max(
    1,
    ...stats.topProducts.map((p) => p.quantity)
  )

  const totalDineTake = stats.dineInCount + stats.takeawayCount
  const dinePercent =
    totalDineTake > 0 ? Math.round((stats.dineInCount / totalDineTake) * 100) : 50

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Sales & Bar Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Live daily performance, peak rush hours, and item volume.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Banknote className="size-4" />
            </div>
          </div>
          <p className="font-display text-4xl font-bold tracking-tight text-foreground">
            {formatPrice(stats.totalRevenueCents)}
          </p>
          <span className="text-xs text-muted-foreground">Across all payments</span>
        </div>

        {/* Total Orders */}
        <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Orders Placed
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Coffee className="size-4" />
            </div>
          </div>
          <p className="font-display text-4xl font-bold tracking-tight text-foreground">
            {stats.totalOrders}
          </p>
          <span className="text-xs text-muted-foreground">Tickets processed</span>
        </div>

        {/* Average Ticket */}
        <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Ticket
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="font-display text-4xl font-bold tracking-tight text-foreground">
            {formatPrice(stats.averageTicketCents)}
          </p>
          <span className="text-xs text-muted-foreground">Per guest transaction</span>
        </div>

        {/* Barista Tips */}
        <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Barista Tips
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="size-4" />
            </div>
          </div>
          <p className="font-display text-4xl font-bold tracking-tight text-foreground">
            {formatPrice(stats.totalTipsCents)}
          </p>
          <span className="text-xs text-muted-foreground">Direct staff gratuity</span>
        </div>
      </div>

      {/* Hourly Sales Distribution & Dine vs Takeaway */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Volume Chart */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Hourly Rush & Volume
              </h2>
              <p className="text-xs text-muted-foreground">
                Orders distributed across cafe opening hours
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">08:00 – 20:00</span>
          </div>

          <div className="flex h-52 items-end gap-2 pt-6">
            {stats.hourlySales.map((h) => {
              const heightPercent = Math.max(
                8,
                Math.round((h.orderCount / maxHourlyCount) * 100)
              )
              return (
                <div
                  key={h.hour}
                  className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 rounded-md bg-stone-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10 whitespace-nowrap">
                    {h.orderCount} orders · {formatPrice(h.revenueCents)}
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-500",
                      h.orderCount > 0
                        ? "bg-primary group-hover:bg-primary/80"
                        : "bg-muted/40"
                    )}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {h.hour}h
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dine-In vs Takeaway */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Order Type Distribution
            </h2>
            <p className="text-xs text-muted-foreground">
              Dine-in guests vs takeaway pickups
            </p>
          </div>

          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <UtensilsCrossed className="size-4 text-primary" />
                Dine In ({stats.dineInCount})
              </span>
              <span>{dinePercent}%</span>
            </div>
            {/* Split progress bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
              <div
                style={{ width: `${dinePercent}%` }}
                className="h-full bg-primary transition-all duration-500"
              />
              <div
                style={{ width: `${100 - dinePercent}%` }}
                className="h-full bg-stone-400 dark:bg-stone-600 transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />
                Takeaway ({stats.takeawayCount})
              </span>
              <span className="text-muted-foreground">{100 - dinePercent}%</span>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
            Monitor counter flow to allocate seating vs bag packaging supplies.
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground">
            Top Selling Menu Items
          </h2>
          <p className="text-xs text-muted-foreground">
            Best performers by unit count and total revenue generated
          </p>
        </div>

        {stats.topProducts.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No sales recorded yet today.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {stats.topProducts.map((prod, index) => {
              const pct = Math.round((prod.quantity / maxProductQty) * 100)
              return (
                <div key={prod.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                      {prod.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {prod.quantity} sold · {formatPrice(prod.revenueCents)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-primary transition-all duration-500"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
