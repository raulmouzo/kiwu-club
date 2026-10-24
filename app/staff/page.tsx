import Link from "next/link"

import { ActionButton } from "@/components/action-button"
import { DogLying, Logo } from "@/components/brand"
import { OrderCard } from "./_components/order-card"
import { RealtimeRefresh } from "./_components/realtime-refresh"
import { buttonVariants } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"
import type { OrderStatus } from "@/lib/actions/orders"
import { getActiveOrders } from "@/lib/orders"
import { requireRole } from "@/lib/supabase/roles"

const COLUMNS: { status: OrderStatus; title: string; dot: string }[] = [
  { status: "pending", title: "New", dot: "bg-primary" },
  { status: "preparing", title: "Preparing", dot: "bg-[#d5c4a8]" },
  { status: "ready", title: "Ready", dot: "bg-[var(--success)]" },
]

export default async function StaffPage() {
  await requireRole("staff")
  const orders = await getActiveOrders()

  return (
    <main className="kiwu-light min-h-svh">
      <RealtimeRefresh />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 p-6 lg:p-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo className="h-12 text-foreground" />
            <h1 className="text-xl font-semibold tracking-tight text-muted-foreground">
              Orders
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/kiosk" className={buttonVariants({ variant: "ghost" })}>
              Kiosk
            </Link>
            <ActionButton action={logout} variant="outline">
              Sign out
            </ActionButton>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnOrders = orders.filter((order) => order.status === column.status)
            return (
              <section key={column.status} className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 px-1 font-semibold">
                  <span className={`size-2.5 rounded-full ${column.dot}`} />
                  {column.title}
                  <span className="text-muted-foreground tabular-nums">
                    {columnOrders.length}
                  </span>
                </h2>

                {columnOrders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-10 text-sm text-muted-foreground">
                    <DogLying className="h-10 text-foreground/50" />
                    No orders
                  </div>
                ) : (
                  columnOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
