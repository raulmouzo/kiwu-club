"use client"

import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter"

// A price whose digits roll to the new amount; it reads like formatPrice
// ("3,20 €") and takes the size and weight of the text around it.
export function Price({ cents }: { cents: number }) {
  return (
    <span className="counter-inherit">
      <AnimatedCounter
        value={cents / 100}
        decimals={2}
        locale="es-ES"
        suffix={" €"}
      />
    </span>
  )
}
