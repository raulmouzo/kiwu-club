"use client"

import { SignOutIcon } from "@phosphor-icons/react"
import { Flame, Leaf, Milk, Snowflake } from "lucide-react"
import { MotionConfig } from "motion/react"
import { useCallback, useRef, useState, useTransition } from "react"

import { ActionButton } from "@/components/action-button"
import { Logo } from "@/components/brand"
import { AttractScreen } from "./attract-screen"
import { cartTotals } from "./cart"
import { Confirmation } from "./confirmation"
import { Segmented } from "./controls"
import { OrderPanel } from "./order-panel"
import { OrderSummaryBar } from "./order-summary-bar"
import { PaymentModal } from "./payment-modal"
import { ProductCarousel } from "./product-carousel"
import { ProductDialog, type SelectedOption } from "./product-dialog"
import { Sheet } from "./sheet"
import { useCart } from "./use-cart"
import { logout } from "@/lib/actions/auth"
import { createOrder, type OrderType } from "@/lib/actions/orders"
import type { Category, Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

type DietaryFilter = "all" | "vegan" | "lactose_free" | "cold" | "hot"

const DIETARY_FILTERS = [
  { id: "all", label: "All", icon: null },
  { id: "vegan", label: "Vegan", icon: Leaf },
  { id: "lactose_free", label: "Lactose-free", icon: Milk },
  { id: "cold", label: "Cold", icon: Snowflake },
  { id: "hot", label: "Hot", icon: Flame },
]

export function Kiosk({
  menu,
  canSignOut,
}: {
  menu: Category[]
  canSignOut: boolean
}) {
  const [categoryId, setCategoryId] = useState(menu[0]?.id)
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("all")
  const [from, setFrom] = useState<"left" | "right">("right")
  const [tappedId, setTappedId] = useState<number>()
  const [openProduct, setOpenProduct] = useState<Product | null>(null)
  // The dialog's buttons sit over the drink's card. A second tap (a double tap,
  // or the tablet's delayed click) lands on the card as soon as the dialog
  // closes and would open it again, so openings are ignored for a moment.
  const reopenLockedUntil = useRef(0)

  const cart = useCart()
  const [name, setName] = useState("")
  const [orderType, setOrderType] = useState<OrderType>("dine_in")
  const [tableNumber, setTableNumber] = useState(1)
  const [pickupTime, setPickupTime] = useState("now")
  const [tipCents, setTipCents] = useState(0)
  const [discountCode, setDiscountCode] = useState("")
  const [discountCents, setDiscountCents] = useState(0)

  const [orderSheet, setOrderSheet] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placed, setPlaced] = useState<{
    orderNumber: number
    name: string
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const finish = useCallback(() => setPlaced(null), [])

  const category = menu.find((c) => c.id === categoryId)

  // Filter products by dietary filter
  const filteredProducts = (category?.products ?? []).filter((product) => {
    if (dietaryFilter === "all") return true
    if (dietaryFilter === "vegan") return product.dietary?.includes("vegan")
    if (dietaryFilter === "lactose_free")
      return (
        product.dietary?.includes("lactose_free") ||
        product.dietary?.includes("vegan")
      )
    if (dietaryFilter === "cold") return product.dietary?.includes("cold")
    if (dietaryFilter === "hot") return product.dietary?.includes("hot")
    return true
  })

  const activeId = filteredProducts.some((p) => p.id === tappedId)
    ? tappedId
    : filteredProducts[0]?.id

  const title =
    filteredProducts.find((p) => p.id === activeId)?.name ?? category?.name

  function changeCategory(id: number) {
    const index = (target: number | undefined) =>
      menu.findIndex((c) => c.id === target)
    setFrom(index(id) > index(categoryId) ? "right" : "left")
    setCategoryId(id)
  }

  function openDialog(product: Product) {
    if (Date.now() < reopenLockedUntil.current) return
    setOpenProduct(product)
  }

  function closeDialog() {
    reopenLockedUntil.current = Date.now() + 600
    setOpenProduct(null)
  }

  function addToOrder(
    product: Product,
    options: SelectedOption[],
    quantity: number
  ) {
    cart.add(product, options, quantity)
    closeDialog()
  }

  // Opens contactless payment modal
  function startPaymentFlow() {
    setError(null)
    if (cart.lines.length === 0 || !name.trim()) return
    setIsPaying(true)
  }

  // Called when payment terminal simulates card approval
  function handlePaymentApproved() {
    setIsPaying(false)
    startTransition(async () => {
      const result = await createOrder({
        customerName: name.trim(),
        orderType,
        items: cart.lines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          optionIds: line.options.map((option) => option.id),
        })),
        tableNumber: orderType === "dine_in" ? tableNumber : null,
        pickupAt:
          orderType === "takeaway" && pickupTime !== "now"
            ? new Date(
                Date.now() + (pickupTime === "10m" ? 10 : 20) * 60 * 1000
              ).toISOString()
            : null,
        tipCents,
        discountCode: discountCode || null,
        paymentMethod: "card",
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
      setTipCents(0)
      setDiscountCode("")
      setDiscountCents(0)
    })
  }

  if (placed) {
    return (
      <MotionConfig reducedMotion="user">
        <Confirmation {...placed} onDone={finish} />
      </MotionConfig>
    )
  }

  const { totalCents: subtotal } = cartTotals(cart.lines)
  const currentTotal = Math.max(0, subtotal + tipCents - discountCents)

  const panel = {
    cart: cart.lines,
    onChangeQuantity: cart.setQuantity,
    name,
    onNameChange: setName,
    orderType,
    onOrderTypeChange: setOrderType,
    tableNumber,
    onTableNumberChange: setTableNumber,
    pickupTime,
    onPickupTimeChange: setPickupTime,
    tipCents,
    onTipChange: setTipCents,
    discountCode,
    onDiscountCodeChange: setDiscountCode,
    discountCents,
    onDiscountCentsChange: setDiscountCents,
    estimatedWaitMinutes: 4,
    error,
    pending,
    onStartPayment: startPaymentFlow,
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-svh">
        {/* Attract Screen when tablet is left idle */}
        <AttractScreen
          tagline="Stay loyal. Drink good coffee."
          tapText="Tap anywhere to order"
        />

        {/* Contactless Card Payment Modal */}
        <PaymentModal
          open={isPaying}
          totalCents={currentTotal}
          customerName={name || "Guest"}
          onCancel={() => setIsPaying(false)}
          onApproved={handlePaymentApproved}
        />

        <div className="grid h-svh gap-8 p-6 pb-28 lg:grid-cols-[1fr_24rem] lg:p-8">
          <section className="relative flex min-h-0 min-w-0 flex-col gap-4">
            {/* Oversized drink title watermark */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <p
                key={title}
                className="absolute top-[30%] left-0 -translate-y-1/2 animate-in text-[clamp(7rem,26svh,12rem)] leading-none font-medium tracking-tighter whitespace-nowrap text-foreground/[0.07] uppercase duration-500 ease-out-soft select-none fade-in-0 slide-in-from-bottom-8"
              >
                {title}
              </p>
            </div>

            <header className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <Logo className="h-[clamp(2.5rem,7svh,3.5rem)] text-foreground" />

              <div className="flex flex-wrap items-center gap-2">
                {/* Categories */}
                <Segmented
                  value={categoryId}
                  onChange={changeCategory}
                  options={menu.map((c) => ({ value: c.id, label: c.name }))}
                />

                {canSignOut && (
                  <ActionButton
                    action={logout}
                    variant="ghost"
                    aria-label="Sign out"
                    title="Sign out"
                    className="size-12 rounded-full text-muted-foreground"
                  >
                    <SignOutIcon weight="bold" className="size-5" />
                  </ActionButton>
                )}
              </div>
            </header>

            {/* Dietary Filter Pills (Icons only, no emojis) */}
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              {DIETARY_FILTERS.map((f) => {
                const Icon = f.icon
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDietaryFilter(f.id as DietaryFilter)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all active:scale-95",
                      dietaryFilter === f.id
                        ? "border border-foreground/30 bg-foreground text-background font-semibold shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="size-3" />}
                    <span>{f.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Product carousel with category slide */}
            <div
              key={`${categoryId}-${dietaryFilter}`}
              className={cn(
                "flex min-h-0 flex-1 animate-in flex-col duration-500 ease-out-soft fade-in-0",
                from === "right"
                  ? "slide-in-from-right-12"
                  : "slide-in-from-left-12"
              )}
            >
              <ProductCarousel
                products={filteredProducts}
                activeId={activeId}
                onActivate={setTappedId}
                onOpen={openDialog}
              />
            </div>

            <p className="relative z-10 text-[clamp(1.25rem,4.5svh,2.25rem)] leading-none font-medium tracking-tight uppercase">
              Stay loyal. Drink good coffee.
            </p>
          </section>

          {/* Desktop order panel */}
          <div className="hidden min-h-0 lg:block">
            <OrderPanel {...panel} />
          </div>
        </div>

        {/* Mobile summary bar and bottom sheet */}
        <OrderSummaryBar
          itemCount={cart.itemCount}
          totalCents={currentTotal}
          onOpen={() => setOrderSheet(true)}
        />
        <Sheet
          open={orderSheet}
          onOpenChange={setOrderSheet}
          className="inset-x-0 bottom-0 mx-auto max-h-[92svh] w-full max-w-xl rounded-t-[2.5rem] bg-background"
        >
          <OrderPanel {...panel} onClose={() => setOrderSheet(false)} />
        </Sheet>

        <ProductDialog
          product={openProduct}
          onClose={closeDialog}
          onAdd={addToOrder}
        />
      </main>
    </MotionConfig>
  )
}
