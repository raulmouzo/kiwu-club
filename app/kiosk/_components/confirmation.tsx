"use client"

import { ArrowRight, QrCode as QrIcon } from "lucide-react"
import { motion, type Variants } from "motion/react"
import { useEffect, useState } from "react"

import { QrCode } from "@/app/welcome/_components/qr-code"
import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter"
import { DogSitting } from "@/components/brand"
import { Button } from "@/components/ui/button"

const RESET_AFTER_MS = 35_000 // 35 seconds gives enough time to scan QR on phone

const EASE = [0.16, 1, 0.3, 1] as const

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

export function Confirmation({
  orderNumber,
  name,
  onDone,
}: {
  orderNumber: number
  name: string
  onDone: () => void
}) {
  const [url, setUrl] = useState(`/status/${orderNumber}`)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}/status/${orderNumber}`)
    }
  }, [orderNumber])

  useEffect(() => {
    const timer = setTimeout(onDone, RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-primary p-6 text-primary-foreground sm:p-10">
      <motion.div
        variants={stage}
        initial="hidden"
        animate="shown"
        className="mx-auto grid w-full max-w-4xl items-center gap-10 md:grid-cols-2 lg:gap-16"
      >
        {/* Left Side: Order Number & Mascot */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <motion.div variants={jump} className="mb-2">
            <DogSitting className="h-36 md:h-44" />
          </motion.div>

          <motion.h1 variants={rise} className="text-2xl font-medium tracking-tight">
            Thanks, {name}!
          </motion.h1>

          <motion.div variants={rise} className="my-3 flex flex-col items-center md:items-start">
            <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
              Your order number
            </p>
            <p className="counter-inherit font-display text-8xl font-bold leading-none sm:text-9xl">
              <AnimatedCounter value={orderNumber} animateOnView />
            </p>
          </motion.div>

          <motion.p variants={rise} className="text-sm opacity-85">
            We will call your number when your coffee is ready.
          </motion.p>

          <motion.div variants={rise} className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="h-13 rounded-2xl px-8 text-base font-semibold shadow-soft active:scale-[0.97]"
              onClick={onDone}
            >
              New order
            </Button>
          </motion.div>
        </div>

        {/* Right Side: QR Code for Phone Tracking */}
        <motion.div
          variants={rise}
          className="flex flex-col items-center gap-4 rounded-[2.5rem] bg-card p-6 text-center text-foreground shadow-lifted sm:p-8"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <QrIcon className="size-4" />
            <span>Track on your phone</span>
          </div>

          <div className="rounded-3xl bg-background p-3 shadow-inner-soft">
            <QrCode
              value={url}
              label={`QR code to track order #${orderNumber} on your phone`}
              className="size-48 sm:size-56"
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-foreground">
              Scan with your phone camera
            </p>
            <p className="text-xs text-muted-foreground">
              Follow real-time status: In queue &rarr; Brewing &rarr; Ready
            </p>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <span>Open tracker directly</span>
            <ArrowRight className="size-3" />
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
