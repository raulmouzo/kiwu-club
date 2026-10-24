import { cn } from "@/lib/utils"

// The brand SVGs are single-colour, so they are used as masks and take the
// current text colour. Ratios come from each file's viewBox.
const ASSETS = {
  logo: {
    src: "/brand/logo.svg",
    ratio: 5.0202212 / 2.9724941,
    label: "Kiwu Club",
  },
  perrete: {
    src: "/brand/perrete.svg",
    ratio: 4.1904001 / 5.5211263,
    label: "",
  },
  tumbadete: {
    src: "/brand/tumbadete.svg",
    ratio: 7.3603158 / 2.9651721,
    label: "",
  },
} as const

export function Brand({
  name,
  className,
}: {
  name: keyof typeof ASSETS
  className?: string
}) {
  const { src, ratio, label } = ASSETS[name]
  const mask = `url(${src})`

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block bg-current", className)}
      style={{
        aspectRatio: ratio,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  )
}
