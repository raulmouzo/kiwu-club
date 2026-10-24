import { DogSitting } from "@/components/brand"
import { QUIET, qrShapes } from "./qr-geometry"

// The visible part of the dog drawing: the head, from the hat to the chin.
const FACE = { box: "80 0 530 570", width: 530, height: 570 }

// A QR code in the Kiwu style: a rounded card, rounded finders, modules that
// merge into soft blobs, and the dog's face in the middle. Colours come from
// the theme (card and foreground), so it follows the page.
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { size, data, finders, centre, radius } = qrShapes(value)
  const total = size + QUIET * 2
  const faceWidth = radius * 1.75
  const faceHeight = (faceWidth * FACE.height) / FACE.width

  return (
    <svg viewBox={`0 0 ${total} ${total}`} role="img" aria-label={label} className={className}>
      <rect width={total} height={total} rx={total * 0.1} className="fill-card" />
      <g transform={`translate(${QUIET} ${QUIET})`} className="fill-foreground">
        <path d={data} />
        <path d={finders} fillRule="evenodd" />
        <DogSitting
          viewBox={FACE.box}
          x={centre - faceWidth / 2}
          y={centre - faceHeight / 2}
          width={faceWidth}
          height={faceHeight}
          className="text-foreground"
        />
      </g>
    </svg>
  )
}
