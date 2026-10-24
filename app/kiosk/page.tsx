import { requireRole } from "@/lib/supabase/roles"

export default async function KioskPage() {
  await requireRole("kiosk", "staff")

  return <main className="min-h-svh p-6">Kiosk</main>
}
