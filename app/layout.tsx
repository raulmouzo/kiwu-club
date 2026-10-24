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
  icons: {
    // Un solo SVG que cambia de color con prefers-color-scheme: Chrome y
    // Safari ignoran `media` en <link rel="icon">.
    icon: [{ url: "/brand/favicon-adaptive.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#f3ebdd",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var prevent = function(e) { e.preventDefault(); };
                document.addEventListener('gesturestart', prevent, { passive: false });
                document.addEventListener('gesturechange', prevent, { passive: false });
                document.addEventListener('gestureend', prevent, { passive: false });
                document.addEventListener('touchmove', function(e) {
                  if (e.touches && e.touches.length > 1) {
                    e.preventDefault();
                  }
                }, { passive: false });
                document.addEventListener('wheel', function(e) {
                  if (e.ctrlKey) {
                    e.preventDefault();
                  }
                }, { passive: false });
                document.addEventListener('keydown', function(e) {
                  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
                    e.preventDefault();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
