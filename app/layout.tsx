import type { Metadata, Viewport } from "next"
import { DM_Sans, Geist_Mono, Lilita_One } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })

const lilita = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: { default: "Kiwu Club", template: "%s · Kiwu Club" },
  description: "Order at the counter and follow every drink from the bar.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#f3ebdd",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        fontMono.variable,
        dmSans.variable,
        lilita.variable,
        "font-sans"
      )}
    >
      <body>{children}</body>
    </html>
  )
}
