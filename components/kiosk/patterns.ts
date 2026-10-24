// Calm, wide-band patterns for the highlighted card. Each drink gets its own:
// the type follows its id, and a slight tilt and scale come from a seeded
// generator, so the look is varied but never changes between renders. They
// stay bold and few on purpose: fine, dense lines vibrate on a screen.

type Tile = {
  w: number
  h: number
  stroke: number
  alpha: number
  body: string
}

const TILES: Tile[] = [
  // wide waves
  {
    w: 240, h: 150, stroke: 64, alpha: 0.13,
    body: "<path d='M-240 40 C-160 -10,-80 90,0 40'/><path d='M0 40 C80 -10,160 90,240 40'/><path d='M240 40 C320 -10,400 90,480 40'/>",
  },
  // wide diagonal stripes
  {
    w: 140, h: 140, stroke: 44, alpha: 0.12,
    body: "<path d='M-35 175 L175 -35'/><path d='M-35 35 L35 -35'/><path d='M105 175 L175 105'/>",
  },
  // big arcs
  { w: 160, h: 132, stroke: 38, alpha: 0.12, body: "<path d='M10 112 A70 70 0 0 1 150 112'/>" },
]

// Brand family: caramel, a livelier sage, a coffee brown and a deeper akaroa. The
// board values are too muted to read as a hue at low opacity. `boost` lifts
// the opacity of the paler ones so each colour shows on a white card.
const PALETTE = [
  { color: "#a66b48", boost: 1.9 },
  { color: "#5f8f4f", boost: 2.4 },
  { color: "#6b4226", boost: 1.8 },
  { color: "#a37b3c", boost: 2 },
]

// Some drinks have an obvious colour; the rest rotate through the palette.
function entryFor(seed: number, name: string) {
  const n = name.toLowerCase()
  if (n.includes("matcha")) return PALETTE[1]
  if (n.includes("mocha")) return PALETTE[2]
  if (n.includes("caramel")) return PALETTE[0]
  return PALETTE[(seed * 3 + 1) % PALETTE.length]
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Pattern = { image: string; width: number; height: number; angle: number; color: string }

export function patternFor(seed: number, name = ""): Pattern {
  // 5 is coprime with the tile count, so consecutive ids never repeat a type.
  const tile = TILES[(seed * 5) % TILES.length]
  const random = mulberry32(Math.imul(seed + 1, 2654435761))
  const scale = 1 + random() * 0.3
  const angle = Math.round((random() - 0.5) * 16)
  const { color, boost } = entryFor(seed, name)
  const alpha = Math.min(0.55, tile.alpha * boost).toFixed(3)

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tile.w}' height='${tile.h}' viewBox='0 0 ${tile.w} ${tile.h}'>` +
    `<g opacity='${alpha}' fill='none' stroke='${color}' stroke-width='${tile.stroke}' stroke-linecap='round'>${tile.body}</g></svg>`

  return {
    image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    width: Math.round(tile.w * scale),
    height: Math.round(tile.h * scale),
    angle,
    color,
  }
}
