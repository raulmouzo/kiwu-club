"use client"

import { CheckCircleIcon, CreditCardIcon, XIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from "react"

import { playPaymentBeep } from "@/lib/audio"
import { formatPrice } from "@/lib/format"

export function PaymentModal({
  open,
  totalCents,
  customerName,
  onCancel,
  onApproved,
}: {
  open: boolean
  totalCents: number
  customerName: string
  onCancel: () => void
  onApproved: () => void
}) {
  const [phase, setPhase] = useState<"ready" | "processing" | "success">("ready")

  useEffect(() => {
    if (!open) {
      setPhase("ready")
      return
    }

    // Step 1: Simulate card detection after 1.4s
    const detectTimer = setTimeout(() => {
      setPhase("processing")
    }, 1200)

    // Step 2: Simulate payment confirmation and sound after 2.5s
    const approveTimer = setTimeout(() => {
      playPaymentBeep()
      setPhase("success")
    }, 2600)

    // Step 3: Complete flow after 3.8s
    const doneTimer = setTimeout(() => {
      onApproved()
    }, 3800)

    return () => {
      clearTimeout(detectTimer)
      clearTimeout(approveTimer)
      clearTimeout(doneTimer)
    }
  }, [open, onApproved])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            className="relative flex w-full max-w-sm flex-col items-center gap-6 rounded-[2.5rem] bg-card p-8 text-center shadow-floating"
          >
            {phase === "ready" && (
              <button
                onClick={onCancel}
                className="absolute top-5 right-5 rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Cancel"
              >
                <XIcon className="size-5" />
              </button>
            )}

            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Kiwu Pay Terminal
              </span>
              <p className="font-display text-4xl font-bold tracking-tight text-foreground">
                {formatPrice(totalCents)}
              </p>
              <p className="text-xs text-muted-foreground">For: {customerName}</p>
            </div>

            {/* Interactive Terminal Screen */}
            <div className="relative flex size-44 items-center justify-center rounded-full bg-muted/60 p-6">
              {phase === "ready" && (
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="relative flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary"
                  >
                    <CreditCardIcon className="size-9" />
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/40" />
                  </motion.div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hold card near reader
                  </span>
                </div>
              )}

              {phase === "processing" && (
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="size-14 rounded-full border-4 border-primary/20 border-t-primary"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Processing…
                  </span>
                </div>
              )}

              {phase === "success" && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="flex flex-col items-center gap-2 text-success"
                >
                  <CheckCircleIcon className="size-16" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Payment approved
                  </span>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <p className="font-medium">Contactless / Apple Pay / Google Pay</p>
              <p className="opacity-75">Instant payment simulation</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
