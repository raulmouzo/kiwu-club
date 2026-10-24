import { cn } from "@/lib/utils"

// Full-bleed doodle illustration for behind a screen. It is one composition,
// not a repeating tile, so it is scaled to cover the area. It is painted as a
// mask: the colour is the text colour, so use className="text-primary
// opacity-20" to change it. `logo` is the version with the Kiwu Club
// lettering drawn into the doodles.
export function Background({
  variant = "plain",
  className,
}: {
  variant?: "plain" | "logo"
  className?: string
}) {
  const file = variant === "logo" ? "background-logo" : "background"
  const mask = `url(/brand/${file}.svg) center / cover no-repeat`

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 bg-current", className)}
      style={{ mask, WebkitMask: mask }}
    />
  )
}
