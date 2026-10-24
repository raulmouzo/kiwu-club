import type { Metadata } from "next"
import Link from "next/link"

import { OrderBoard } from "./_components/order-board"
import { RealtimeRefresh } from "./_components/realtime-refresh"
import { ActionButton } from "@/components/action-button"
import { Logo } from "@/components/brand"
import { buttonVariants } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"
import { getActiveOrders } from "@/lib/orders"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "Orders" }

export default async function StaffPage() {
  await requireRole("staff")
  const orders = await getActiveOrders()

  return (
    <main className="min-h-svh">
      <RealtimeRefresh />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 p-6 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo className="h-12 text-foreground" />
            <h1 className="text-xl font-semibold tracking-tight text-muted-foreground">
              Orders
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/kiosk"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Kiosk
            </Link>
            <ActionButton action={logout} variant="outline" size="lg">
              Sign out
            </ActionButton>
          </div>
        </header>

        <OrderBoard orders={orders} />
      </div>
    </main>
  )
}
