"use server"

import { redirect } from "next/navigation"

import { loginSchema, type LoginInput } from "@/lib/schemas/auth"
import { createClient } from "@/lib/supabase/server"

export type LoginResult = { error: string }

// The browser validated the input already, but it is checked again here.
// Wrong password and unknown email share one message on purpose, so the form
// cannot be used to find out which accounts exist.
export async function login(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { error: "Enter a valid email and password." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // Only reported once the credentials are right, so it reveals nothing.
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirm your email before signing in."
          : "Invalid email or password.",
    }
  }

  redirect("/")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
