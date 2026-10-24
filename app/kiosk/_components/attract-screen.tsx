"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { DogSitting, Logo } from "@/components/brand"

const IDLE_TIMEOUT_MS = 50_000 // 50 seconds

export function AttractScreen({
  tagline = "Stay loyal. Drink good coffee.",
  tapText = "Tap anywhere to order",
}: {
  tagline?: string
  tapText?: string
}) {
  const [isIdle, setIsIdle] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      setIsIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS)
    }

    const events = ["pointerdown", "keydown", "touchstart"]
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }))

    resetTimer()

    return () => {
      clearTimeout(timer)
      events.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [])

  return (
    <AnimatePresence>
      {isIdle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setIsIdle(false)}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-between overflow-hidden bg-background/95 p-10 backdrop-blur-md select-none"
        >
          <div className="flex w-full items-center justify-between">
            <Logo className="h-14 text-foreground" />
            <span className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Kiosk mode
            </span>
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{
              scale: [0.95, 1, 0.95],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <DogSitting className="h-56 text-primary drop-shadow-sm" />
            <h1 className="font-display text-5xl tracking-tight text-foreground md:text-6xl">
              KIWU CLUB
            </h1>
            <p className="text-xl font-medium text-muted-foreground">{tagline}</p>
          </motion.div>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-primary-foreground shadow-lifted">
              <span className="size-2.5 animate-ping rounded-full bg-primary-foreground" />
              <span className="text-base font-semibold tracking-wide uppercase">
                {tapText}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Specialty coffee · Made to order
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
