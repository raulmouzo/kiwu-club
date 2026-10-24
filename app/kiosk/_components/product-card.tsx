import Image from "next/image"
import { useMemo, type CSSProperties } from "react"

import { patternFor } from "./patterns"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

type Props = {
  product: Product
  /** The card sits in the middle of the row. */
  active: boolean
  onTap: () => void
}

// Every card has the same layout size, so the row never reflows. Its growth,
// lifted glass, tinted pattern, ring and "Customize" hint all follow the
// scroll (see .card-focus). Everything inside is sized in em from
// --card-size, so the card scales with the row.
export function ProductCard({ product, active, onTap }: Props) {
  const pattern = useMemo(
    () => patternFor(product.id, product.name),
    [product.id, product.name]
  )

  return (
    <div
      data-card
      data-active={active}
      style={{ "--tint": pattern.color } as CSSProperties}
      className={cn(
        "card-focus relative flex h-[calc(var(--card-size)*1.1)] w-[calc(var(--card-size)*0.7)] shrink-0 snap-center flex-col rounded-[2.25rem] bg-card text-[length:clamp(0.8rem,calc(var(--card-size)*0.062),1rem)] transition-shadow duration-500 ease-out-soft",
        active ? "z-10 shadow-lifted" : "shadow-soft",
        !product.is_available && "opacity-50"
      )}
    >
      <Pattern pattern={pattern} />

      {/* The glass rises a little above the card, further out in the middle. */}
      <div className="pointer-events-none relative min-h-0 flex-1">
        {product.image_url && (
          <div
            data-glass
            className="absolute inset-x-[6%] -top-[14%] bottom-0 origin-bottom"
          >
            <Image
              src={product.image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 320px, 240px"
              className="object-contain object-center"
            />
          </div>
        )}
      </div>

      <div className="pointer-events-none relative flex flex-col gap-[0.3em] p-[1.4em]">
        <p className="font-display text-[1.7em] leading-tight">
          {product.name}
        </p>
        <div className="flex min-h-[2.6em] flex-wrap items-center justify-between gap-[0.5em]">
          <p className="text-[1.15em] font-semibold whitespace-nowrap tabular-nums">
            {product.is_available
              ? formatPrice(product.price_cents)
              : "Sold out"}
          </p>
          {product.is_available && (
            <span
              aria-hidden
              data-hint
              className="rounded-full bg-foreground px-[1em] py-[0.55em] text-[0.9em] font-semibold text-background"
            >
              Customize
            </span>
          )}
        </div>
      </div>

      {/* Covers the whole card: a tap brings it to the middle, or opens it. */}
      <button
        type="button"
        aria-pressed={active}
        aria-label={
          active ? `Customize ${product.name}` : `Show ${product.name}`
        }
        onClick={onTap}
        className="absolute inset-0 touch-manipulation rounded-[2.25rem] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  )
}

// A band pattern, tilted and tinted per drink; it fades in near the middle.
function Pattern({ pattern }: { pattern: ReturnType<typeof patternFor> }) {
  return (
    <div
      aria-hidden
      data-pattern
      className="absolute inset-0 overflow-hidden rounded-[2.25rem]"
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
  )
}
