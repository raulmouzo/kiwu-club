"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import type * as React from "react"

import { cn } from "@/lib/utils"

// Full-bleed surface for the kiosk: a dimmed backdrop and a light popup
// whose geometry comes from `className`.
function Sheet({
  open,
  onOpenChange,
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed z-50 flex flex-col ease-out-soft outline-none data-open:animate-in data-open:duration-500 data-open:fade-in-0 data-open:slide-in-from-bottom-8 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:duration-200 data-closed:fade-out-0 data-closed:slide-out-to-bottom-4",
            className
          )}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const SheetTitle = DialogPrimitive.Title
const SheetDescription = DialogPrimitive.Description

export { Sheet, SheetDescription, SheetTitle }
