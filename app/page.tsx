import { redirect } from "next/navigation"

import { LogoutButton } from "@/components/logout-button"
import { getRole } from "@/lib/supabase/roles"

export default async function Page() {
  const role = await getRole()

  if (role === "kiosk") redirect("/kiosk")
  if (role === "staff") redirect("/staff")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p>This account has no access yet. Ask an admin to assign a role.</p>
      <LogoutButton />
    </main>
  )
}
