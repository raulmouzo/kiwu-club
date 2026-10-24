// Layout maths for the carousel row. Card widths are relative to --card-size
// and must match the classes in product-card.tsx.
export const IDLE_WIDTH = 0.74
export const ACTIVE_WIDTH = 1.3

// Time for the previously open card to close before the next one is reached.
export const CLOSE_MS = 260

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Places the row. With nothing selected it rests at the left edge. With a
 * selection the sides grow to half the row minus half an open card, so even the
 * first and last card can reach the centre, and the row glides to the selected
 * card, aimed at where its open size will be centred. Resolves once it stops.
 */
export function layoutRow(
  scroller: HTMLDivElement | null,
  probe: HTMLSpanElement | null,
  hasSelection: boolean,
  smooth: boolean
): Promise<void> {
  if (!scroller || !probe) return Promise.resolve()

  const base = probe.offsetHeight // --card-size in pixels
  const before = parseFloat(getComputedStyle(scroller).paddingLeft) || 0

  // The default padding comes from the classes; an inline value overrides it.
  scroller.style.paddingLeft = ""
  scroller.style.paddingRight = ""
  const resting = parseFloat(getComputedStyle(scroller).paddingLeft) || 0
  const padding = hasSelection
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

  if (!hasSelection) return scrollTo(scroller, 0, smooth)

  const cards = [...scroller.querySelectorAll<HTMLElement>("[data-card]")]
  const index = cards.findIndex((card) => card.dataset.selected === "true")
  if (index < 0) return Promise.resolve()

  const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0
  const left =
    padding + index * (base * IDLE_WIDTH + gap) + (base * ACTIVE_WIDTH) / 2 - scroller.clientWidth / 2

  return scrollTo(scroller, left, smooth)
}

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
