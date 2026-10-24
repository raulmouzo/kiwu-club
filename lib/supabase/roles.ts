import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AppRole = "staff" | "kiosk" | "customer"

// Staff can read every row in user_roles (to manage roles), so the query must
// filter by the signed-in user: without it staff would get several rows back.
export async function getRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims.sub
  if (!userId) return null

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle()
  return (data?.role as AppRole | undefined) ?? null
}

export async function requireRole(...allowed: AppRole[]) {
  const role = await getRole()
  if (!role || !allowed.includes(role)) redirect("/")
  return role
}
