"use client"

import { useCallback, useState, useTransition } from "react"

import { Brand } from "@/components/brand"
import { Confirmation } from "./confirmation"
import { Segmented } from "./controls"
import { OrderPanel } from "./order-panel"
import { OrderSummaryBar } from "./order-summary-bar"
import { ProductCarousel } from "./product-carousel"
import { ProductDialog, type SelectedOption } from "./product-dialog"
import { Sheet } from "./sheet"
import { useCart } from "./use-cart"
import { createOrder, type OrderType } from "@/lib/actions/orders"
import type { Category, Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

export function Kiosk({ menu }: { menu: Category[] }) {
  const [categoryId, setCategoryId] = useState(menu[0]?.id)
  const [tappedId, setTappedId] = useState<number>()
  const [openProduct, setOpenProduct] = useState<Product | null>(null)

  const cart = useCart()
  const [name, setName] = useState("")
  const [orderType, setOrderType] = useState<OrderType>("dine_in")
  const [orderSheet, setOrderSheet] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placed, setPlaced] = useState<{ orderNumber: number; name: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const finish = useCallback(() => setPlaced(null), [])

  const category = menu.find((c) => c.id === categoryId)
  const categoryIndex = menu.findIndex((c) => c.id === categoryId)
  // Nothing is highlighted until the guest taps a drink of this category.
  const activeId = category?.products.some((p) => p.id === tappedId) ? tappedId : undefined
  const title = category?.products.find((p) => p.id === activeId)?.name ?? category?.name

  function addToOrder(product: Product, options: SelectedOption[], quantity: number) {
    cart.add(product, options, quantity)
    setOpenProduct(null)
  }

  function placeOrder() {
    setError(null)
    startTransition(async () => {
      const result = await createOrder({
        customerName: name.trim(),
        orderType,
        items: cart.lines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          optionIds: line.options.map((option) => option.id),
        })),
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setPlaced({ orderNumber: result.orderNumber, name: name.trim() })
      setOrderSheet(false)
      cart.clear()
      setName("")
      setOrderType("dine_in")
    })
  }

  if (placed) return <Confirmation {...placed} onDone={finish} />

  const panel = {
    cart: cart.lines,
    onChangeQuantity: cart.setQuantity,
    name,
    onNameChange: setName,
    orderType,
    onOrderTypeChange: setOrderType,
    error,
    pending,
    onPlace: placeOrder,
  }

  return (
    <main className="kiwu-light min-h-svh">
      <div className="grid h-svh gap-8 p-6 pb-28 lg:grid-cols-[1fr_24rem] lg:p-8">
        <section className="relative flex min-h-0 min-w-0 flex-col gap-4">
          {/* Oversized name of the highlighted drink, faded into the background. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <p className="absolute top-[30%] left-0 -translate-y-1/2 text-[clamp(7rem,26svh,12rem)] leading-none font-medium tracking-tighter whitespace-nowrap text-foreground/[0.07] uppercase select-none">
              {title}
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

          {/* Remounted per category so each one slides in from its own side. */}
          <div
            key={categoryId}
            className={cn(
              "flex min-h-0 flex-1 flex-col duration-300 animate-in fade-in-0",
              categoryIndex > 0 ? "slide-in-from-right-8" : "slide-in-from-left-8"
            )}
          >
            <ProductCarousel
              products={category?.products ?? []}
              activeId={activeId}
              onActivate={setTappedId}
              onOpen={setOpenProduct}
            />
          </div>

          <p className="relative z-10 text-[clamp(1.25rem,4.5svh,2.25rem)] leading-none font-medium tracking-tight uppercase">
            Stay loyal. Drink good coffee.
          </p>
        </section>

        {/* On narrow screens the order lives in a sheet behind the summary bar. */}
        <div className="hidden min-h-0 lg:block">
          <OrderPanel {...panel} />
        </div>
      </div>

      <OrderSummaryBar itemCount={cart.itemCount} totalCents={cart.totalCents} onOpen={() => setOrderSheet(true)} />
      <Sheet
        open={orderSheet}
        onOpenChange={setOrderSheet}
        className="inset-x-0 bottom-0 mx-auto max-h-[92svh] w-full max-w-xl rounded-t-[2rem] bg-background"
      >
        <OrderPanel {...panel} onClose={() => setOrderSheet(false)} />
      </Sheet>

      <ProductDialog product={openProduct} onClose={() => setOpenProduct(null)} onAdd={addToOrder} />
    </main>
  )
}
