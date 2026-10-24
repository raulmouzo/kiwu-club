"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useEffect, useLayoutEffect, useRef } from "react"

import { ProductCard } from "./product-card"
import type { Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

type Props = {
  products: Product[]
  /** The drink in the middle of the row. */
  activeId: number | undefined
  onActivate: (id: number) => void
  onOpen: (product: Product) => void
}

// A row of drinks that snaps one card into the middle. Swiping is native
// scrolling, so it follows the finger. Every frame each card gets --focus
// (how near the middle it is), which drives its growth and glass live; the
// active drink only changes once the row comes to rest, so a fast swipe does
// not restart the ring, pattern and title on every card it passes. Cards
// never change size in the layout. --card-size comes from the height the row
// really has (cqh).
export function ProductCarousel({
  products,
  activeId,
  onActivate,
  onOpen,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)
  // The card the row is heading to, so quick arrow taps add up.
  const target = useRef<number | null>(null)
  const index = products.findIndex((product) => product.id === activeId)

  // Opening on a drink chosen earlier puts it in the middle straight away.
  useLayoutEffect(() => {
    centre(scroller.current, index, false)
    // Only on mount: later changes come from the row itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const row = scroller.current
    if (!row) return
    const resize = new ResizeObserver(() => setFocus(row))
    resize.observe(row)
    return () => {
      resize.disconnect()
      cancelAnimationFrame(frame.current)
      clearTimeout(settle.current)
    }
  }, [])

  function onScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setFocus(scroller.current))
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      target.current = null
      const id = products[nearestToMiddle(scroller.current)]?.id
      if (id !== undefined && id !== activeId) onActivate(id)
    }, 120)
  }

  function go(at: number) {
    target.current = Math.max(0, Math.min(products.length - 1, at))
    centre(scroller.current, target.current, true)
  }

  // A tap on the middle card opens it; a tap on any other brings it to the middle.
  function tap(product: Product, at: number) {
    if (product.id !== activeId) go(at)
    else if (product.is_available) onOpen(product)
  }

  return (
    <div className="[container-type:size] relative -mx-6 min-h-0 flex-1 lg:-mx-8">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="relative flex h-full snap-x snap-mandatory [scrollbar-width:none] items-center gap-5 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] px-[calc(50%-var(--card-size)*0.35)] pt-[12cqh] [--card-size:clamp(11rem,calc(72cqh-2rem),22rem)]"
      >
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            active={product.id === activeId}
            onTap={() => tap(product, i)}
          />
        ))}
      </div>

      <Arrow
        side="left"
        visible={index > 0}
        onClick={() => go((target.current ?? index) - 1)}
      />
      <Arrow
        side="right"
        visible={index < products.length - 1}
        onClick={() => go((target.current ?? index) + 1)}
      />
    </div>
  )
}

const cardsIn = (row: HTMLElement) => [
  ...row.querySelectorAll<HTMLElement>("[data-card]"),
]

// Layout offsets, not screen boxes, so the on-screen growth does not count.
function nearestToMiddle(row: HTMLElement | null) {
  if (!row) return -1
  const middle = row.scrollLeft + row.clientWidth / 2
  let nearest = -1
  let best = Infinity
  cardsIn(row).forEach((card, i) => {
    const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle)
    if (distance < best) {
      best = distance
      nearest = i
    }
  })
  return nearest
}

// 1 in the middle, down to 0 a card's width away. Layout offsets, so the
// on-screen growth it drives does not feed back into it.
function setFocus(row: HTMLElement | null) {
  if (!row) return
  const middle = row.scrollLeft + row.clientWidth / 2
  for (const card of cardsIn(row)) {
    const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle)
    const value = Math.max(0, 1 - distance / card.offsetWidth)
    card.style.setProperty("--focus", value.toFixed(3))
  }
}

function centre(row: HTMLElement | null, at: number, smooth: boolean) {
  const card = row && cardsIn(row)[at]
  if (!row || !card) return
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  row.scrollTo({
    left: card.offsetLeft + card.offsetWidth / 2 - row.clientWidth / 2,
    behavior: smooth && !reduce ? "smooth" : "instant",
  })
}

function Arrow({
  side,
  visible,
  onClick,
}: {
  side: "left" | "right"
  visible: boolean
  onClick: () => void
}) {
  const Icon = side === "left" ? CaretLeftIcon : CaretRightIcon

  return (
    <button
      type="button"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      aria-label={side === "left" ? "Previous drink" : "Next drink"}
      onClick={onClick}
      className={cn(
        "absolute top-[calc(50%+4cqh)] z-20 grid size-12 -translate-y-1/2 touch-manipulation place-items-center rounded-full bg-card shadow-[0_4px_16px_rgb(48_40_32/0.18)] transition-[opacity,scale] duration-300 active:scale-90",
        side === "left" ? "left-4 lg:left-6" : "right-4 lg:right-6",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <Icon weight="bold" className="size-5" />
    </button>
  )
}
