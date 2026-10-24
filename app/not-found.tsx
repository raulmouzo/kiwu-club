import Link from "next/link"

import { DogLying } from "@/components/brand"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <DogLying className="h-24 text-foreground/70" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl">Nothing brewing here</h1>
        <p className="text-muted-foreground">This page does not exist.</p>
      </div>
      <Link
        href="/"
        className={buttonVariants({
          size: "lg",
          className: "h-12 px-6 text-base",
        })}
      >
        Back to start
      </Link>
    </main>
  )
}
