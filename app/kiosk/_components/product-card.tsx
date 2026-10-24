import Image from "next/image"
import type { CSSProperties } from "react"

import { patternFor } from "./patterns"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

type Props = {
  product: Product
  /** The guest tapped this drink; the row is moving to it. */
  selected: boolean
  /** The card is drawn open, once the row has stopped. */
  open: boolean
  onSelect: (id: number) => void
  onOpen: (product: Product) => void
}

// The card sets one base font size from --card-size; everything inside is
// sized in em, so the whole card scales together with the row.
export function ProductCard({ product, selected, open, onSelect, onOpen }: Props) {
  const pattern = open ? patternFor(product.id, product.name) : null

  // First tap highlights the drink; a second tap opens it.
  function tap() {
    if (open) onOpen(product)
    else if (!selected) onSelect(product.id)
  }

  return (
    <div
      data-card
      data-selected={selected}
      style={pattern ? ({ "--tint": pattern.color } as CSSProperties) : undefined}
      className={cn(
        "relative flex shrink-0 flex-col rounded-[2.25rem] text-[length:clamp(0.8rem,calc(var(--card-size)*0.062),1rem)] transition-[width,height,box-shadow] duration-300 ease-in-out motion-reduce:transition-none",
        open
          ? "h-[calc(var(--card-size)*1.55)] w-[calc(var(--card-size)*1.3)] bg-white text-foreground shadow-[0_16px_40px_rgb(48_40_32/0.16)] ring-2 ring-[var(--tint)]"
          : "h-[var(--card-size)] w-[calc(var(--card-size)*0.74)] bg-card shadow-[0_1px_2px_rgb(48_40_32/0.05),0_8px_24px_rgb(48_40_32/0.06)]",
        !product.is_available && "opacity-50"
      )}
    >
      {pattern && <Pattern pattern={pattern} />}

      {/* The glass sits in the middle of the free space above the text. Open,
          it is larger and rises a little above the card. */}
      <div className="pointer-events-none relative min-h-0 flex-1">
        {product.image_url && (
          <div
            className={cn(
              "absolute origin-center transition-all duration-300 ease-in-out motion-reduce:transition-none",
              open ? "inset-x-[6%] -top-[26%] -bottom-[4%] scale-[1.12]" : "inset-x-[8%] top-3 bottom-2 scale-[1.2]"
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

      <div className="pointer-events-none relative flex flex-col gap-[0.4em] p-[1.4em]">
        <p className={open ? "font-display text-[2.4em] leading-tight" : "text-[1.3em] leading-tight font-semibold tracking-tight"}>
          {product.name}
        </p>

        {open ? (
          <div className="flex flex-col gap-[0.4em] duration-300 animate-in fade-in-0">
            {product.description && <p className="line-clamp-2 text-muted-foreground">{product.description}</p>}
            {product.groups.length > 0 && (
              <p className="text-[0.8em] text-muted-foreground">
                {product.groups.map((group) => group.name).join(" · ")}
              </p>
            )}
            <div className="mt-[0.5em] flex items-center justify-between gap-[0.5em]">
              <p className="text-[1.9em] font-semibold tabular-nums">{formatPrice(product.price_cents)}</p>
              {product.is_available && (
                <button
                  type="button"
                  onClick={() => onOpen(product)}
                  className="pointer-events-auto relative z-10 h-[3.5em] touch-manipulation rounded-full border border-foreground/15 bg-white px-[1.3em] font-semibold text-[#302820] shadow-[0_2px_8px_rgb(48_40_32/0.12)] transition-[transform,box-shadow] duration-300 animate-in fill-mode-both fade-in-0 slide-in-from-bottom-2 delay-100 hover:shadow-[0_4px_12px_rgb(48_40_32/0.18)] active:scale-95"
                >
                  Customize
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {product.is_available ? formatPrice(product.price_cents) : "Sold out"}
          </p>
        )}
      </div>

      {/* Covers the whole card so any tap on it selects or opens the drink. */}
      <button
        type="button"
        disabled={!product.is_available}
        aria-pressed={open}
        aria-label={open ? `Customize ${product.name}` : `Select ${product.name}`}
        onClick={tap}
        className="absolute inset-0 rounded-[2.25rem] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  )
}

// A static band pattern, tilted and tinted per drink; it fades in with the card.
function Pattern({ pattern }: { pattern: ReturnType<typeof patternFor> }) {
  return (
    <div aria-hidden className="absolute inset-0 animate-in overflow-hidden rounded-[2.25rem] duration-300 fade-in-0">
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
