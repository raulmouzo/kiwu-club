import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AppRole = "staff" | "kiosk" | "customer"

// RLS lets each user read only their own row in user_roles.
export async function getRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("user_roles").select("role").maybeSingle()
  return (data?.role as AppRole | undefined) ?? null
}

export async function requireRole(...allowed: AppRole[]) {
  const role = await getRole()
  if (!role || !allowed.includes(role)) redirect("/")
  return role
}
