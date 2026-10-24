import type { Metadata } from "next"

import { StaffNav } from "../_components/staff-nav"
import { OrderHistoryView } from "./_components/order-history-view"
import { getOrderHistoryAction } from "@/lib/actions/orders"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "Order History · Kiwu Club" }

export default async function StaffHistoryPage() {
  await requireRole("staff")
  const initialHistory = await getOrderHistoryAction()

  return (
    <main className="min-h-svh p-6 lg:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <StaffNav />
        <OrderHistoryView initialHistory={initialHistory} />
      </div>
    </main>
  )
}
