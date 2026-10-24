"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ActionButton } from "@/components/action-button"
import { Logo } from "@/components/brand"
import { buttonVariants } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/staff", label: "KDS Orders" },
  { href: "/staff/menu", label: "Menu & 86" },
  { href: "/staff/history", label: "History" },
  { href: "/staff/dashboard", label: "Sales Analytics" },
  { href: "/staff/roles", label: "Roles" },
]

export function StaffNav() {
  const pathname = usePathname()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
      <div className="flex flex-wrap items-center gap-6">
        <Link href="/staff">
          <Logo className="h-10 text-foreground transition-opacity hover:opacity-80" />
        </Link>

        <nav className="flex flex-wrap items-center gap-1 rounded-2xl bg-muted/60 p-1 text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/ready"
          target="_blank"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          TV Board
        </Link>
        <Link
          href="/kiosk"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Kiosk
        </Link>
        <ActionButton action={logout} variant="outline" size="sm">
          Sign out
        </ActionButton>
      </div>
    </header>
  )
}
