"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import Image from "next/image"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"

import { patternFor } from "@/components/kiosk/patterns"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

type Props = {
  products: Product[]
  activeId: number | undefined
  onActivate: (id: number) => void
  onOpen: (product: Product) => void
}

// Card widths relative to --card-size. They must match the classes below.
const IDLE_WIDTH = 0.74
const ACTIVE_WIDTH = 1.3

// Nothing is selected at first and the list starts at the left. Tapping a
// drink opens its card and keeps it in the middle of the row. --card-size is
// derived from the height the row really has (cqh), so it fits any screen.
export function ProductCarousel({ products, activeId, onActivate, onOpen }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)
  const run = useRef(0)
  const [edges, setEdges] = useState({ left: false, right: false })

  // `activeId` is the drink the guest tapped. `expandedId` is the one drawn
  // open. They are kept apart so the two animations never overlap: the previous
  // card closes and the row glides until the tapped card sits where its final,
  // open size will be centred; only then does that card open, and its
  // background appears together with it.
  const [expandedId, setExpandedId] = useState<number>()
  const expanded = expandedId === activeId ? activeId : undefined

  useLayoutEffect(() => {
    const current = ++run.current
    const smooth = placed.current
    placed.current = true

    const moved = layoutRow(scroller.current, probe.current, activeId !== undefined, smooth)
    Promise.all([moved, wait(smooth ? CLOSE_MS : 0)]).then(() => {
      if (run.current === current) setExpandedId(activeId)
    })
  }, [activeId, products])

  useEffect(() => {
    const relayout = () => layoutRow(scroller.current, probe.current, activeId !== undefined, false)
    window.addEventListener("resize", relayout)
    return () => window.removeEventListener("resize", relayout)
  }, [activeId])

  // Which sides still have cards out of view.
  const updateEdges = () => {
    const el = scroller.current
    if (!el) return
    const left = el.scrollLeft > 8
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 8
    setEdges((current) => (current.left === left && current.right === right ? current : { left, right }))
  }

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const left = el.scrollLeft > 8
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 8
      setEdges((current) => (current.left === left && current.right === right ? current : { left, right }))
    })
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    return () => observer.disconnect()
  }, [products])

  // The arrows step through the drinks. With nothing selected, "next" picks
  // the first one.
  const index = products.findIndex((product) => product.id === activeId)
  const step = (delta: 1 | -1) => {
    const next = index === -1 ? products[0] : products[index + delta]
    if (next) onActivate(next.id)
  }
  const hasPrevious = index > 0
  const hasNext = index === -1 ? edges.right : index < products.length - 1

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
            active={product.id === expanded}
            onActivate={onActivate}
            onOpen={onOpen}
          />
        ))}
      </div>

      <Arrow side="left" fade={edges.left} visible={hasPrevious} onClick={() => step(-1)} />
      <Arrow side="right" fade={edges.right} visible={hasNext} onClick={() => step(1)} />
    </div>
  )
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

const CLOSE_MS = 260

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function layoutRow(
  scroller: HTMLDivElement | null,
  probe: HTMLSpanElement | null,
  hasActive: boolean,
  smooth: boolean
): Promise<void> {
  if (!scroller || !probe) return Promise.resolve()

  const base = probe.offsetHeight
  const before = parseFloat(getComputedStyle(scroller).paddingLeft) || 0

  // The default padding comes from the classes. With a selection the sides
  // grow to half the row minus half an open card, so even the first and last
  // card can reach the centre.
  scroller.style.paddingLeft = ""
  scroller.style.paddingRight = ""
  const resting = parseFloat(getComputedStyle(scroller).paddingLeft) || 0
  const padding = hasActive
    ? Math.max(resting, scroller.clientWidth / 2 - (base * ACTIVE_WIDTH) / 2)
    : resting
  if (padding !== resting) {
    // Extra room at the end lets the last card reach the centre while it is
    // still closed, because the target assumes its open width.
    scroller.style.paddingLeft = `${padding}px`
    scroller.style.paddingRight = `${padding + base * (ACTIVE_WIDTH - IDLE_WIDTH)}px`
  }
  // Keep the content where it was on screen while the padding changes.
  scroller.scrollLeft += padding - before

  if (!hasActive) return scrollTo(scroller, 0, smooth)

  const cards = [...scroller.querySelectorAll<HTMLElement>("[data-card]")]
  const index = cards.findIndex((card) => card.dataset.selected === "true")
  if (index < 0) return Promise.resolve()
  const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0
  const left =
    padding + index * (base * IDLE_WIDTH + gap) + (base * ACTIVE_WIDTH) / 2 - scroller.clientWidth / 2

  return scrollTo(scroller, left, smooth)
}

// Resolves once the row has really stopped at `left`.
function scrollTo(scroller: HTMLDivElement, left: number, smooth: boolean): Promise<void> {
  const target = Math.max(0, left)
  if (!smooth || Math.abs(scroller.scrollLeft - target) < 1) {
    scroller.scrollTo({ left: target, behavior: "auto" })
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const done = () => {
      scroller.removeEventListener("scrollend", onEnd)
      clearTimeout(fallback)
      resolve()
    }
    // An earlier, instant scroll can fire its own `scrollend`; ignore it.
    const onEnd = () => Math.abs(scroller.scrollLeft - target) < 2 && done()
    const fallback = setTimeout(done, 900)
    scroller.addEventListener("scrollend", onEnd)
    scroller.scrollTo({ left: target, behavior: "smooth" })
  })
}

// First tap opens the card and shows its details; a second tap (or the
// button) opens the drink.
function ProductCard({
  product,
  selected,
  active,
  onActivate,
  onOpen,
}: {
  product: Product
  selected: boolean
  active: boolean
  onActivate: Props["onActivate"]
  onOpen: Props["onOpen"]
}) {
  const pattern = active ? patternFor(product.id, product.name) : null

  function onSelect() {
    if (active) return onOpen(product)
    if (!selected) onActivate(product.id)
  }

  return (
    <div
      data-card
      data-selected={selected}
      style={pattern ? ({ "--tint": pattern.color } as CSSProperties) : undefined}
      className={cn(
        "relative flex shrink-0 flex-col rounded-[2.25rem] transition-[width,height,box-shadow] duration-300 ease-in-out motion-reduce:transition-none",
        active
          ? "h-[calc(var(--card-size)*1.55)] w-[calc(var(--card-size)*1.3)] bg-white text-foreground shadow-[0_16px_40px_rgb(48_40_32/0.16)] ring-2 ring-[var(--tint)]"
          : "h-[var(--card-size)] w-[calc(var(--card-size)*0.74)] bg-card shadow-[0_1px_2px_rgb(48_40_32/0.05),0_8px_24px_rgb(48_40_32/0.06)]",
        !product.is_available && "opacity-50"
      )}
    >
      {pattern && (
        <div
          aria-hidden
          className="absolute inset-0 animate-in overflow-hidden rounded-[2.25rem] duration-300 fade-in-0"
        >
          <div
            className="absolute -inset-1/2"
            style={{
              backgroundImage: pattern.image,
              backgroundSize: `${pattern.width}px ${pattern.height}px`,
              transform: `rotate(${pattern.angle}deg)`,
            }}
          />
        </div>
      )}

      {/* The glass sits in the middle of the free space above the text. Open,
          it is larger and rises a little above the card. */}
      <div className="pointer-events-none relative min-h-0 flex-1">
        {product.image_url && (
          <div
            className={cn(
              "absolute origin-center transition-all duration-300 ease-in-out motion-reduce:transition-none",
              active ? "inset-x-[6%] -top-[26%] -bottom-[4%] scale-[1.12]" : "inset-x-[8%] top-3 bottom-2 scale-[1.2]"
            )}
          >
            <Image
              src={product.image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 420px, 300px"
              className="object-contain object-center"
            />
          </div>
        )}
      </div>

      <div className="pointer-events-none relative flex flex-col gap-1.5 p-[clamp(0.875rem,calc(var(--card-size)*0.09),1.5rem)]">
        <p
          className={cn(
            active
              ? "font-display text-[clamp(1.5rem,calc(var(--card-size)*0.15),2.25rem)] leading-tight"
              : "text-[clamp(0.95rem,calc(var(--card-size)*0.08),1.25rem)] leading-tight font-semibold tracking-tight"
          )}
        >
          {product.name}
        </p>

        {active ? (
          <div className="flex flex-col gap-1.5 duration-300 animate-in fade-in-0">
            {product.description && (
              <p className="line-clamp-2 text-[clamp(0.8rem,calc(var(--card-size)*0.062),1rem)] text-muted-foreground">
                {product.description}
              </p>
            )}
            {product.groups.length > 0 && (
              <p className="text-[clamp(0.7rem,calc(var(--card-size)*0.05),0.875rem)] text-muted-foreground">
                {product.groups.map((group) => group.name).join(" · ")}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[clamp(1.25rem,calc(var(--card-size)*0.12),1.875rem)] font-semibold tabular-nums">
                {formatPrice(product.price_cents)}
              </p>
              {product.is_available && (
                <button
                  type="button"
                  onClick={() => onOpen(product)}
                  className="pointer-events-auto relative z-10 duration-300 animate-in fill-mode-both fade-in-0 slide-in-from-bottom-2 delay-100 transition-[transform,box-shadow] hover:shadow-[0_4px_12px_rgb(48_40_32/0.18)] active:scale-95 h-[clamp(2.5rem,calc(var(--card-size)*0.22),3.5rem)] touch-manipulation rounded-full border border-foreground/15 bg-white px-[clamp(0.875rem,calc(var(--card-size)*0.08),1.5rem)] text-[clamp(0.8rem,calc(var(--card-size)*0.062),1rem)] font-semibold text-[#302820] shadow-[0_2px_8px_rgb(48_40_32/0.12)]"
                >
                  Customize
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[clamp(0.8rem,calc(var(--card-size)*0.062),1rem)] text-muted-foreground">
            {product.is_available ? formatPrice(product.price_cents) : "Sold out"}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!product.is_available}
        aria-pressed={active}
        aria-label={active ? `Customize ${product.name}` : `Select ${product.name}`}
        onClick={onSelect}
        className="absolute inset-0 rounded-[2.25rem] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  )
}
