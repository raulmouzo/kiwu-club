import { Kiosk } from "@/components/kiosk/kiosk"
import { getMenu } from "@/lib/menu"
import { requireRole } from "@/lib/supabase/roles"

export default async function KioskPage() {
  await requireRole("kiosk", "staff")
  const menu = await getMenu()

  return <Kiosk menu={menu} />
}
