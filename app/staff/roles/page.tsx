import type { Metadata } from "next"

import { StaffNav } from "../_components/staff-nav"
import { RolesManager } from "./_components/roles-manager"
import { listUserRoles } from "@/lib/actions/roles"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "Role Management · Kiwu Club" }

export default async function StaffRolesPage() {
  await requireRole("staff")
  const initialRoles = await listUserRoles()

  return (
    <main className="min-h-svh p-6 lg:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <StaffNav />
        <RolesManager initialRoles={initialRoles} />
      </div>
    </main>
  )
}
