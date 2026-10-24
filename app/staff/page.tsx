import type { Metadata } from "next"

import { OrderBoard } from "./_components/order-board"
import { RealtimeRefresh } from "./_components/realtime-refresh"
import { StaffNav } from "./_components/staff-nav"
import { getActiveOrders } from "@/lib/orders"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "KDS Orders · Kiwu Club" }

export default async function StaffPage() {
  await requireRole("staff")
  const orders = await getActiveOrders()

  return (
    <main className="min-h-svh p-6 lg:p-10">
      <RealtimeRefresh />
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <StaffNav />
        <OrderBoard orders={orders} />
      </div>
    </main>
  )
}
