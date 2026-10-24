import { ActionButton } from "@/components/action-button"
import { logout } from "@/lib/actions/auth"
import { requireRole } from "@/lib/supabase/roles"

export default async function StaffPage() {
  await requireRole("staff")

  return (
    <main className="flex min-h-svh flex-col gap-4 p-6">
      <div>Staff</div>
      <ActionButton action={logout} variant="outline">
        Sign out
      </ActionButton>
    </main>
  )
}
