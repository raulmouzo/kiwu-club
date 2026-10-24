import { Logo } from "@/components/brand"

const shimmer =
  "animate-shimmer bg-[linear-gradient(100deg,transparent_30%,rgb(255_253_248/0.7)_50%,transparent_70%)] bg-[length:200%_100%]"

// Same frame as the kiosk: header, a row of cards and the order column.
export default function Loading() {
  return (
    <main
      className="grid h-svh gap-8 p-6 lg:grid-cols-[1fr_24rem] lg:p-8"
      aria-busy="true"
    >
      <span className="sr-only">Loading the menu</span>
      <section className="flex min-h-0 flex-col gap-4">
        <header className="flex items-center justify-between gap-4">
          <Logo
            className="h-[clamp(2.5rem,7svh,3.5rem)] text-foreground"
          />
          <div
            className={`h-12 w-56 rounded-full bg-foreground/8 ${shimmer}`}
          />
        </header>
        <div className="flex flex-1 items-center gap-5 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`aspect-[0.74] h-[min(24rem,50svh)] shrink-0 rounded-[2.25rem] bg-card shadow-soft ${shimmer}`}
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </section>
      <div
        className={`hidden rounded-[2rem] bg-card shadow-soft lg:block ${shimmer}`}
      />
    </main>
  )
}
