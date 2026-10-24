import type { Metadata } from "next"

import { StaffNav } from "../_components/staff-nav"
import { SalesDashboard } from "./_components/sales-dashboard"
import { getStaffAnalytics } from "@/lib/actions/analytics"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "Sales Analytics · Kiwu Club" }

export default async function StaffDashboardPage() {
  await requireRole("staff")
  const stats = await getStaffAnalytics()

  return (
    <main className="min-h-svh p-6 lg:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <StaffNav />
        <SalesDashboard stats={stats} />
      </div>
    </main>
  )
}
