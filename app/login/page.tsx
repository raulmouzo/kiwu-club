import type { Metadata } from "next"

import { Background, Logo } from "@/components/brand"
import { LoginForm } from "./_components/login-form"

export const metadata: Metadata = { title: "Sign in · Kiwu Club" }

export default function LoginPage() {
  return (
    <main className="kiwu-light relative isolate flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden p-6">
      <Background className="text-primary opacity-20" />
      <Logo className="h-20 text-foreground" />
      <LoginForm />
    </main>
  )
}
