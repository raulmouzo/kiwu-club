import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { DogSitting, Logo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Order Tracker · Kiwu Club",
  description: "Enter your order number to follow brew progress live.",
}

export default async function StatusLookupPage() {
  async function searchOrder(formData: FormData) {
    "use server"
    const number = formData.get("orderNumber")?.toString().trim()
    if (number) {
      redirect(`/status/${number}`)
    }
  }

  return (
    <main className="kiwu-light min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-between p-6 sm:p-8">
        <header className="flex w-full items-center justify-between">
          <Link href="/kiosk">
            <Logo className="h-10 text-foreground transition-opacity hover:opacity-80" />
          </Link>
        </header>

        <div className="flex w-full flex-col items-center gap-6 rounded-[2.5rem] bg-card p-8 text-center shadow-soft">
          <DogSitting className="h-44 text-primary" />

          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Track your order
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your order number from your receipt to check if your coffee is brewing or ready to collect.
            </p>
          </div>

          <form action={searchOrder} className="flex w-full flex-col gap-3">
            <Input
              name="orderNumber"
              type="number"
              min={1}
              required
              placeholder="e.g. 14"
              className="h-14 rounded-2xl bg-background text-center font-display text-2xl font-bold"
            />
            <Button size="lg" type="submit" className="h-12 rounded-xl text-base font-semibold">
              Track order live
            </Button>
          </form>
        </div>

        <footer className="py-4 text-center text-xs text-muted-foreground">
          Kiwu Club · Specialty Coffee
        </footer>
      </div>
    </main>
  )
}
