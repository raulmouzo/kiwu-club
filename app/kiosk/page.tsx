import { Kiosk } from "./_components/kiosk"
import { getMenu } from "@/lib/menu"
import { requireRole } from "@/lib/supabase/roles"

export default async function KioskPage() {
  const role = await requireRole("kiosk", "staff")
  const menu = await getMenu()

  // The tablet account stays signed in; only staff can sign out from here.
  return <Kiosk menu={menu} canSignOut={role === "staff"} />
}
