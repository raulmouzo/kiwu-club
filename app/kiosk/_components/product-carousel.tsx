"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { ProductCard } from "./product-card"
import { CLOSE_MS, layoutRow, wait } from "./row-layout"
import type { Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

type Props = {
  products: Product[]
  /** The drink the guest tapped, if any. Nothing is selected at first. */
  activeId: number | undefined
  onActivate: (id: number) => void
  onOpen: (product: Product) => void
}

// A row of cards that starts at the left. Tapping a drink moves the row so the
// card ends up in the middle, then opens it. --card-size comes from the height
// the row really has (cqh), so it fits any screen.
export function ProductCarousel({ products, activeId, onActivate, onOpen }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)
  const run = useRef(0)
  const [edges, setEdges] = useState<Edges>({ left: false, right: false })

  // `openId` lags behind `activeId` on purpose: the two animations never
  // overlap. The row moves first and the card opens, with its background, only
  // once it has stopped.
  const [openId, setOpenId] = useState<number>()
  const open = openId === activeId ? activeId : undefined

  useLayoutEffect(() => {
    const current = ++run.current
    const smooth = placed.current
    placed.current = true

    const moved = layoutRow(scroller.current, probe.current, activeId !== undefined, smooth)
    Promise.all([moved, wait(smooth ? CLOSE_MS : 0)]).then(() => {
      if (run.current === current) setOpenId(activeId)
    })
  }, [activeId, products])

  useEffect(() => {
    const relayout = () => layoutRow(scroller.current, probe.current, activeId !== undefined, false)
    window.addEventListener("resize", relayout)
    return () => window.removeEventListener("resize", relayout)
  }, [activeId])

  const updateEdges = () => {
    const el = scroller.current
    if (el) setEdges((current) => nextEdges(current, el))
  }

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const observer = new ResizeObserver(() => setEdges((current) => nextEdges(current, el)))
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    return () => observer.disconnect()
  }, [products])

  // The arrows step through the drinks; with nothing selected, "next" picks the first.
  const index = products.findIndex((product) => product.id === activeId)
  const step = (delta: 1 | -1) => {
    const next = index === -1 ? products[0] : products[index + delta]
    if (next) onActivate(next.id)
  }

  return (
    <div className="relative -mx-6 min-h-0 flex-1 [container-type:size] lg:-mx-8">
      <div
        ref={scroller}
        onScroll={updateEdges}
        className="relative flex h-full items-center gap-5 overflow-x-auto px-6 pt-[calc(var(--card-size)*0.42)] pb-6 [--card-size:clamp(11rem,calc(50cqh-0.75rem),24rem)] [scrollbar-width:none] lg:px-8"
      >
        {/* Measures --card-size in pixels. */}
        <span ref={probe} aria-hidden className="pointer-events-none absolute h-[var(--card-size)] w-px" />
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selected={product.id === activeId}
            open={product.id === open}
            onSelect={onActivate}
            onOpen={onOpen}
          />
        ))}
      </div>

      <Arrow side="left" fade={edges.left} visible={index > 0} onClick={() => step(-1)} />
      <Arrow
        side="right"
        fade={edges.right}
        visible={index === -1 ? edges.right : index < products.length - 1}
        onClick={() => step(1)}
      />
    </div>
  )
}

type Edges = { left: boolean; right: boolean }

// Which sides of the row still have cards out of view. Returns `current`
// unchanged when nothing moved, so React skips the re-render.
function nextEdges(current: Edges, el: HTMLElement): Edges {
  const left = el.scrollLeft > 8
  const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 8
  return current.left === left && current.right === right ? current : { left, right }
}

// A fade marks a side with more cards out of view; the arrow steps to the
// previous or next drink.
function Arrow({
  side,
  fade,
  visible,
  onClick,
}: {
  side: "left" | "right"
  fade: boolean
  visible: boolean
  onClick: () => void
}) {
  const Icon = side === "left" ? CaretLeftIcon : CaretRightIcon

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 z-10 w-24 transition-opacity duration-300",
          side === "left"
            ? "left-0 bg-gradient-to-r from-background to-transparent"
            : "right-0 bg-gradient-to-l from-background to-transparent",
          fade ? "opacity-100" : "opacity-0"
        )}
      />
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        aria-label={side === "left" ? "Previous drink" : "Next drink"}
        onClick={onClick}
        className={cn(
          "absolute top-1/2 z-20 grid size-12 -translate-y-1/2 touch-manipulation place-items-center rounded-full bg-card shadow-[0_4px_16px_rgb(48_40_32/0.18)] transition-[opacity,transform] duration-300 active:scale-95",
          side === "left" ? "left-4 lg:left-6" : "right-4 lg:right-6",
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Icon weight="bold" className="size-5" />
      </button>
    </>
  )
}
