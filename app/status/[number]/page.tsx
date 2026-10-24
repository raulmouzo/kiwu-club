import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Logo } from "@/components/brand"
import { getOrderStatusAction } from "@/lib/actions/orders"
import { StatusTracker } from "./_components/status-tracker"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>
}): Promise<Metadata> {
  const { number } = await params
  return {
    title: `Order #${number} · Live tracker · Kiwu Club`,
    description: `Track your order #${number} in real time at Kiwu Club.`,
  }
}

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ number: string }>
}) {
  const { number } = await params
  const orderNumber = parseInt(number, 10)
  if (isNaN(orderNumber)) notFound()

  const initialOrder = await getOrderStatusAction(orderNumber)

  return (
    <main className="kiwu-light min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-between p-6 sm:p-8">
        <header className="flex items-center justify-between">
          <Link href="/kiosk">
            <Logo className="h-10 text-foreground transition-opacity hover:opacity-80" />
          </Link>
          <span className="rounded-full border border-border bg-card px-3.5 py-1 text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase">
            Live Tracker
          </span>
        </header>

        <StatusTracker orderNumber={orderNumber} initialOrder={initialOrder} />

        <footer className="py-4 text-center text-xs text-muted-foreground">
          <p>Kiwu Club · Specialty Coffee</p>
          <p className="mt-0.5 opacity-70">
            Updated in real time. Keep this screen open.
          </p>
        </footer>
      </div>
    </main>
  )
}
