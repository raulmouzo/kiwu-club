"use client"

import { useEffect } from "react"

import { DogSitting } from "@/components/brand"
import { Button } from "@/components/ui/button"

const RESET_AFTER_MS = 15_000

// Shown after an order is placed, then returns to the start for the next guest.
export function Confirmation({
  orderNumber,
  name,
  onDone,
}: {
  orderNumber: number
  name: string
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <main className="kiwu-light">
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-primary p-6 text-center text-primary-foreground">
        <DogSitting className="h-52" />
        <p className="text-xl">Thanks, {name}!</p>
        <p className="text-sm tracking-widest uppercase opacity-80">Your order number</p>
        <p className="font-display text-9xl leading-none tabular-nums">{orderNumber}</p>
        <p className="opacity-80">We will call you when it is ready.</p>
        <p className="text-sm font-medium tracking-widest uppercase opacity-70">Stay loyal. Drink good coffee.</p>
        <Button size="lg" variant="secondary" className="mt-2 h-14 px-10 text-lg" onClick={onDone}>
          New order
        </Button>
      </div>
    </main>
  )
}
