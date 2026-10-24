import { LogoutButton } from "@/components/logout-button"
import { requireRole } from "@/lib/supabase/roles"

export default async function StaffPage() {
  await requireRole("staff")

  return (
    <main className="flex min-h-svh flex-col gap-4 p-6">
      <div>Staff</div>
      <LogoutButton />
    </main>
  )
}
