"use client"

import { useState } from "react"

import { cartTotals, MAX_QUANTITY, type CartLine } from "./cart"
import type { SelectedOption } from "./product-dialog"
import type { Product } from "@/lib/menu"

// The same drink with the same options is one line; adding it again raises
// its quantity.
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  function add(product: Product, options: SelectedOption[], quantity: number) {
    const key = `${product.id}:${options.map((option) => option.id).sort((a, b) => a - b).join(",")}`
    setLines((current) =>
      current.some((line) => line.key === key)
        ? current.map((line) =>
            line.key === key ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) } : line
          )
        : [...current, { key, product, options, quantity }]
    )
  }

  // A quantity below 1 removes the line.
  function setQuantity(key: string, quantity: number) {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => line.key !== key)
        : current.map((line) => (line.key === key ? { ...line, quantity } : line))
    )
  }

  return { lines, add, setQuantity, clear: () => setLines([]), ...cartTotals(lines) }
}
