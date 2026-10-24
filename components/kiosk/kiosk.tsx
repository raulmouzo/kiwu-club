"use client"

import { useEffect, useState, useTransition } from "react"

import { Brand } from "@/components/brand"
import { lineCents, MAX_QUANTITY, type CartLine } from "@/components/kiosk/cart"
import { Segmented } from "@/components/kiosk/controls"
import { OrderPanel } from "@/components/kiosk/order-panel"
import { OrderSummaryBar } from "@/components/kiosk/order-summary-bar"
import { ProductCarousel } from "@/components/kiosk/product-carousel"
import { ProductDialog, type SelectedOption } from "@/components/kiosk/product-dialog"
import { Sheet } from "@/components/kiosk/sheet"
import { Button } from "@/components/ui/button"
import { createOrder, type OrderType } from "@/lib/actions/orders"
import type { Category, Product } from "@/lib/menu"

type Confirmation = { orderNumber: number; name: string }

const RESET_AFTER_MS = 15_000

export function Kiosk({ menu }: { menu: Category[] }) {
  const [categoryId, setCategoryId] = useState(menu[0]?.id)
  const [activeProductId, setActiveId] = useState<number>()
  const [selected, setSelected] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [name, setName] = useState("")
  const [orderType, setOrderType] = useState<OrderType>("dine_in")
  const [orderOpen, setOrderOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [pending, startTransition] = useTransition()

  const category = menu.find((c) => c.id === categoryId)
  // Nothing is highlighted until the guest taps a drink.
  const activeId = category?.products.some((p) => p.id === activeProductId)
    ? activeProductId
    : undefined
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const totalCents = cart.reduce((sum, line) => sum + lineCents(line), 0)
  const activeName = category?.products.find((p) => p.id === activeId)?.name ?? category?.name

  // Back to the start screen for the next customer.
  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => setConfirmation(null), RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [confirmation])

  function addToCart(product: Product, options: SelectedOption[], quantity: number) {
    const key = `${product.id}:${options.map((o) => o.id).sort((a, b) => a - b).join(",")}`
    setCart((current) => {
      const existing = current.find((line) => line.key === key)
      if (!existing) return [...current, { key, product, options, quantity }]
      return current.map((line) =>
        line.key === key
          ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) }
          : line
      )
    })
    setSelected(null)
  }

  function setQuantity(key: string, quantity: number) {
    setCart((current) =>
      quantity < 1
        ? current.filter((line) => line.key !== key)
        : current.map((line) => (line.key === key ? { ...line, quantity } : line))
    )
  }

  function placeOrder() {
    setError(null)
    startTransition(async () => {
      const result = await createOrder({
        customerName: name.trim(),
        orderType,
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          optionIds: line.options.map((option) => option.id),
        })),
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setConfirmation({ orderNumber: result.orderNumber, name: name.trim() })
      setOrderOpen(false)
      setCart([])
      setName("")
      setOrderType("dine_in")
    })
  }

  const panelProps = {
    cart,
    onChangeQuantity: setQuantity,
    name,
    onNameChange: setName,
    orderType,
    onOrderTypeChange: setOrderType,
    error,
    pending,
    onPlace: placeOrder,
  }

  if (confirmation) {
    return (
      <main className="kiwu-light">
        <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-primary p-6 text-center text-primary-foreground">
          <Brand name="perrete" className="h-52" />
          <p className="text-xl">Thanks, {confirmation.name}!</p>
          <p className="text-sm tracking-widest uppercase opacity-80">
            Your order number
          </p>
          <p className="font-display text-9xl leading-none tabular-nums">
            {confirmation.orderNumber}
          </p>
          <p className="opacity-80">We will call you when it is ready.</p>
          <p className="text-sm font-medium tracking-widest uppercase opacity-70">
            Stay loyal. Drink good coffee.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-2 h-14 px-10 text-lg"
            onClick={() => setConfirmation(null)}
          >
            New order
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="kiwu-light min-h-svh">
      <div className="grid h-svh gap-8 p-6 pb-28 lg:grid-cols-[1fr_24rem] lg:p-8">
        <section className="relative flex min-h-0 min-w-0 flex-col gap-4">
          {/* Oversized name of the highlighted drink, faded into the background. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <p
              key={activeName}
              className="absolute top-[30%] left-0 -translate-y-1/2 text-[clamp(7rem,26svh,12rem)] leading-none font-medium tracking-tighter whitespace-nowrap text-foreground/[0.07] uppercase select-none"
            >
              {activeName}
            </p>
          </div>

          <header className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <Brand name="logo" className="h-[clamp(2.5rem,7svh,3.5rem)] text-foreground" />
            <Segmented
              value={categoryId}
              onChange={setCategoryId}
              options={menu.map((c) => ({ value: c.id, label: c.name }))}
            />
          </header>

          <div key={categoryId} className="flex min-h-0 flex-1 flex-col">
            <ProductCarousel
              products={category?.products ?? []}
              activeId={activeId}
              onActivate={setActiveId}
              onOpen={setSelected}
            />
          </div>

          <p className="relative z-10 text-[clamp(1.25rem,4.5svh,2.25rem)] leading-none font-medium tracking-tight uppercase">
            Stay loyal. Drink good coffee.
          </p>
        </section>

        <div className="hidden min-h-0 lg:block">
          <OrderPanel {...panelProps} />
        </div>
      </div>

      <OrderSummaryBar
        itemCount={itemCount}
        totalCents={totalCents}
        onOpen={() => setOrderOpen(true)}
      />
      <Sheet
        open={orderOpen}
        onOpenChange={setOrderOpen}
        className="inset-x-0 bottom-0 mx-auto max-h-[92svh] w-full max-w-xl rounded-t-[2rem] bg-background"
      >
        <OrderPanel {...panelProps} onClose={() => setOrderOpen(false)} />
      </Sheet>

      <ProductDialog
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={addToCart}
      />
    </main>
  )
}
