import type { Metadata } from "next"

import { OrderBoard } from "@/app/staff/_components/order-board"
import { RealtimeRefresh } from "@/app/staff/_components/realtime-refresh"
import { Logo } from "@/components/brand"
import { ActionButton } from "@/components/action-button"
import { logout } from "@/lib/actions/auth"
import { getCustomerOrders } from "@/lib/orders"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "My order" }

export default async function CustomerPage() {
  await requireRole("customer")
  const orders = await getCustomerOrders()

  return (
    <main className="min-h-svh">
      <RealtimeRefresh />
      <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6 lg:p-10">
        <header className="flex items-center justify-between gap-4">
          <Logo className="h-12 text-foreground" />
          <ActionButton action={logout} variant="outline" size="lg">
            Sign out
          </ActionButton>
        </header>
        <OrderBoard orders={orders} />
      </div>
    </main>
  )
}
