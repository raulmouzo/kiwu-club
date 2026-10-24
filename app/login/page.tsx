import type { Metadata } from "next"

import { DogLying, Logo } from "@/components/brand"
import { LoginForm } from "./_components/login-form"

export const metadata: Metadata = { title: "Sign in · Kiwu Club" }

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <Logo className="h-20 text-foreground" />
      <LoginForm />
      <DogLying className="h-14 text-foreground/60" />
    </main>
  )
}

