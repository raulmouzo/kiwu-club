"use client"

import { useActionState } from "react"

import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/actions/auth"

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <Brand name="logo" className="h-20 text-foreground" />

      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-5 rounded-[2rem] bg-card p-8 shadow-[0_8px_32px_rgb(48_40_32/0.08)]"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 rounded-2xl bg-background px-4 text-base"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 rounded-2xl bg-background px-4 text-base"
          />
        </div>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="h-12 text-base"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Brand name="tumbadete" className="h-14 text-foreground/60" />
    </main>
  )
}
