import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"

import { Background, CoffeeCup, Logo } from "@/components/brand"
import { buttonVariants } from "@/components/ui/button"
import { requireRole } from "@/lib/supabase/roles"
import { cn } from "@/lib/utils"
import { QrCode } from "./_components/qr-code"

export const metadata: Metadata = { title: "Welcome · Kiwu Club" }

// Where the phone is sent. A placeholder until signing in from the phone and
// pairing it with this tablet exist.
const PHONE_SIGN_IN_PATH = "/login"

// The address a phone can reach this app at. NEXT_PUBLIC_SITE_URL wins; in
// development that is how a phone on the same network can open the QR (use the
// computer's address, not localhost).
async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  return `${protocol}://${host}`
}

export default async function WelcomePage() {
  await requireRole("kiosk", "staff")
  const qrValue = `${await siteUrl()}${PHONE_SIGN_IN_PATH}`

  return (
    <main className="kiwu-light relative isolate min-h-svh overflow-hidden">
      <Background className="text-primary opacity-15" />

      <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-10 p-8 lg:grid-cols-[1fr_auto] lg:gap-20 lg:p-12">
        <section className="flex flex-col items-start gap-[clamp(1.5rem,5svh,3rem)]">
          <Logo className="h-[clamp(3.5rem,11svh,6.5rem)] text-foreground" />

          <h1 className="text-[clamp(2.25rem,8svh,4.5rem)] leading-[0.95] font-medium tracking-tight uppercase">
            Stay loyal.
            <br />
            Drink good coffee.
          </h1>

          <div className="flex items-center gap-6">
            <Link href="/kiosk" className={cn(buttonVariants({ size: "lg" }), "h-16 px-10 text-xl")}>
              Start your order
            </Link>
            <CoffeeCup className="h-[clamp(3.5rem,10svh,5.5rem)] text-primary" />
          </div>
        </section>

        <section className="flex flex-col items-center gap-5">
          <QrCode
            value={qrValue}
            label="QR code to sign in with your phone"
            className="w-[min(46svh,26rem)] drop-shadow-[0_16px_32px_rgb(48_40_32/0.18)]"
          />
          <p className="text-center text-lg font-medium tracking-tight">Scan to sign in with your phone</p>
        </section>
      </div>
    </main>
  )
}
