"use client"

import { motion, type Variants } from "motion/react"
import { useEffect } from "react"

import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter"
import { DogSitting } from "@/components/brand"
import { Button } from "@/components/ui/button"

const RESET_AFTER_MS = 15_000

const EASE = [0.16, 1, 0.3, 1] as const

// The dog jumps in first, then the rest settles in reading order.
const stage: Variants = {
  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
const jump: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.85 },
  shown: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.35, visualDuration: 0.5 },
  },
}

// Shown after an order is placed, then returns to the start for the next guest.
export function Confirmation({
  orderNumber,
  name,
  onDone,
}: {
  orderNumber: number
  name: string
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-primary p-6 text-center text-primary-foreground">
      <motion.div
        variants={stage}
        initial="hidden"
        animate="shown"
        className="flex flex-col items-center gap-5"
      >
        <motion.div variants={jump}>
          <DogSitting className="h-52" />
        </motion.div>
        <motion.h1 variants={rise} className="text-xl">
          Thanks, {name}!
        </motion.h1>
        <motion.div
          variants={rise}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm tracking-widest uppercase opacity-80">
            Your order number
          </p>
          <p className="counter-inherit font-display text-9xl leading-none">
            <AnimatedCounter value={orderNumber} animateOnView />
          </p>
        </motion.div>
        <motion.p variants={rise} className="opacity-80">
          We will call you when it is ready.
        </motion.p>
        <motion.div variants={rise} className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            className="mt-2 h-14 px-10 text-lg active:scale-[0.97]"
            onClick={onDone}
          >
            New order
          </Button>
          <a
            href={`/status/${orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground/25"
          >
            <span>Track order on your phone</span>
            <span>&rarr;</span>
          </a>
        </motion.div>
      </motion.div>

      {/* Drains while the screen waits, so the next guest sees it is about to reset. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1.5 bg-primary-foreground/15 motion-reduce:hidden"
      >
        <div
          className="h-full origin-left animate-drain bg-primary-foreground/70"
          style={{ animationDuration: `${RESET_AFTER_MS}ms` }}
        />
      </div>
    </main>
  )
}
