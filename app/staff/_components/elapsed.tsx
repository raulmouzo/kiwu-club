"use client"

import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 15_000)
  return () => clearInterval(timer)
}

// Minutes since an order was placed. The server snapshot is null, so nothing
// renders until hydration and the server and browser clocks never disagree.
export function Elapsed({ since }: { since: string }) {
  const minutes = useSyncExternalStore(
    subscribe,
    () => Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 60_000)),
    () => null
  )

  if (minutes === null) return null
  return <span className="tabular-nums">{minutes < 1 ? "just now" : `${minutes} min`}</span>
}
