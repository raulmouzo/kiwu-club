import { Brand } from "@/components/brand"

const shimmer =
  "animate-shimmer bg-[linear-gradient(100deg,transparent_30%,rgb(255_253_248/0.7)_50%,transparent_70%)] bg-[length:200%_100%]"

// Same frame as the order board: header and three columns of cards.
export default function Loading() {
  return (
    <main
      className="mx-auto flex max-w-7xl flex-col gap-8 p-6 lg:p-10"
      aria-busy="true"
    >
      <span className="sr-only">Loading orders</span>
      <header className="flex items-center gap-4">
        <Brand name="logo" className="h-12 text-foreground" />
        <span className="text-xl font-semibold tracking-tight text-muted-foreground">
          Orders
        </span>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {[2, 1, 1].map((cards, column) => (
          <div key={column} className="flex flex-col gap-4">
            <div className="h-6 w-28 rounded-full bg-foreground/8" />
            {Array.from({ length: cards }, (_, i) => (
              <div
                key={i}
                className={`h-56 rounded-3xl bg-card shadow-soft ${shimmer}`}
              />
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}
