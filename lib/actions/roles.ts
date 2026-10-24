"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { AppRole } from "@/lib/supabase/roles"

export type UserRoleItem = {
  user_id: string
  role: AppRole
  email?: string
}

export async function listUserRoles(): Promise<UserRoleItem[]> {
  const supabase = await createClient()

  // Get user_roles
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role")

  if (error || !data) return []

  return data as UserRoleItem[]
}

export async function setUserRole(
  userId: string,
  role: AppRole
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role })

  if (error) return { ok: false, error: error.message }
  revalidatePath("/staff")
  return { ok: true }
}

export async function removeUserRole(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/staff")
  return { ok: true }
}
