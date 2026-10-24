import QRCode from "qrcode"

// Margin around the code, in modules, inside the rounded card.
export const QUIET = 3

type Radii = [topLeft: number, topRight: number, bottomRight: number, bottomLeft: number]

// A rectangle with its own radius on each corner, as an SVG path.
function roundedRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: Radii) {
  const arc = (r: number, toX: number, toY: number) => (r ? `A${r} ${r} 0 0 1 ${toX} ${toY}` : "")
  return (
    `M${x + tl} ${y}H${x + w - tr}${arc(tr, x + w, y + tr)}` +
    `V${y + h - br}${arc(br, x + w - br, y + h)}` +
    `H${x + bl}${arc(bl, x, y + h - bl)}` +
    `V${y + tl}${arc(tl, x + tl, y)}Z`
  )
}

/**
 * Shapes of a QR code drawn in the Kiwu style, in module units:
 * - finders: the three corner squares, as a rounded ring around a rounded core
 * - data: every other dark module, where touching modules merge into one blob
 *   and only the outer corners are rounded
 * - a round clearing in the middle for the logo
 * The error correction is the highest level, which is what makes the clearing
 * safe to scan.
 */
export function qrShapes(value: string) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "H" })
  const size = modules.size
  const dark = (x: number, y: number) => x >= 0 && y >= 0 && x < size && y < size && modules.data[y * size + x] === 1

  const centre = size / 2
  const radius = Math.min(4.6, size * 0.19)
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)
  const cleared = (x: number, y: number) => Math.hypot(x + 0.5 - centre, y + 0.5 - centre) < radius
  const filled = (x: number, y: number) => dark(x, y) && !inFinder(x, y) && !cleared(x, y)

  // Horizontal runs of dark modules. A run is one shape; its two ends are
  // rounded on the sides that have no neighbour above or below.
  let data = ""
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!filled(x, y)) continue
      let end = x
      while (filled(end + 1, y)) end++
      const r = (open: boolean) => (open ? 0.5 : 0)
      data += roundedRect(x, y, end - x + 1, 1, [
        r(!filled(x, y - 1)),
        r(!filled(end, y - 1)),
        r(!filled(end, y + 1)),
        r(!filled(x, y + 1)),
      ])
      x = end
    }
  }

  // Ring, gap and core of each finder; drawn with the even-odd rule. Rounder
  // corners look softer but are harder for strict scanners, so they stay moderate.
  let finders = ""
  for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
    finders +=
      roundedRect(ox, oy, 7, 7, [1.5, 1.5, 1.5, 1.5]) +
      roundedRect(ox + 1, oy + 1, 5, 5, [0.8, 0.8, 0.8, 0.8]) +
      roundedRect(ox + 2, oy + 2, 3, 3, [0.7, 0.7, 0.7, 0.7])
  }

  return { size, data, finders, centre, radius }
}
