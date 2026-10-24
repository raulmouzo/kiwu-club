import { redirect } from "next/navigation"

import { ActionButton } from "@/components/action-button"
import { logout } from "@/lib/actions/auth"
import { getCustomerOrders } from "@/lib/orders"
import { getRole } from "@/lib/supabase/roles"

export default async function Page() {
  const role = await getRole()

  if (role === "kiosk") redirect("/welcome")
  if (role === "staff") redirect("/staff")
  if (role === "customer") {
    const orders = await getCustomerOrders()
    const active = orders.find((o) =>
      ["pending", "preparing", "ready"].includes(o.status)
    )
    if (active) redirect(`/status/${active.order_number}`)
    redirect("/status")
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p>This account has no access yet. Ask an admin to assign a role.</p>
      <ActionButton action={logout} variant="outline">
        Sign out
      </ActionButton>
    </main>
  )
}
