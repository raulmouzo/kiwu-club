import type { Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/brand"
import { getActiveOrders } from "@/lib/orders"
import { ReadyBoardScreen } from "./_components/ready-board-screen"

export const metadata: Metadata = {
  title: "Pantalla de comandas · Kiwu Club",
  description: "Pantalla pública para el mostrador de recogida.",
}

export default async function ReadyPage() {
  const activeOrders = await getActiveOrders()

  return (
    <main className="kiwu-dark min-h-svh bg-stone-950 text-stone-100 p-6 lg:p-10">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col justify-between gap-8">
        <header className="flex items-center justify-between border-b border-stone-800 pb-6">
          <div className="flex items-center gap-4">
            <Logo className="h-12 text-stone-100" />
            <span className="rounded-full bg-stone-800 px-3.5 py-1 text-xs font-mono tracking-widest text-stone-400 uppercase">
              Pantalla de recogida
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/kiosk"
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Kiosk
            </Link>
            <Link
              href="/staff"
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Staff
            </Link>
          </div>
        </header>

        <ReadyBoardScreen initialOrders={activeOrders} />

        <footer className="flex items-center justify-between border-t border-stone-800 pt-6 text-xs text-stone-400">
          <span>Kiwu Club · Café de especialidad recién tostado</span>
          <span className="flex items-center gap-2">
            <span className="size-2 animate-ping rounded-full bg-emerald-500" />
            Actualización continua
          </span>
        </footer>
      </div>
    </main>
  )
}
