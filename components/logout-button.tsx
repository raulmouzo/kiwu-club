import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions"

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  )
}
