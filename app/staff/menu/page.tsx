import type { Metadata } from "next"

import { StaffNav } from "../_components/staff-nav"
import { MenuEditor } from "./_components/menu-editor"
import { getMenu } from "@/lib/menu"
import { requireRole } from "@/lib/supabase/roles"

export const metadata: Metadata = { title: "Menu & 86 Admin · Kiwu Club" }

export default async function StaffMenuPage() {
  await requireRole("staff")
  const menu = await getMenu()

  return (
    <main className="min-h-svh p-6 lg:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <StaffNav />
        <MenuEditor initialMenu={menu} />
      </div>
    </main>
  )
}
