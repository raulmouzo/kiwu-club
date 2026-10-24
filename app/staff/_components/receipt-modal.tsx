"use client"

import { Printer, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { formatPrice } from "@/lib/format"
import { Button } from "@/components/ui/button"

type ReceiptItem = {
  name: string
  quantity: number
  unitCents?: number
  options?: string[]
}

type ReceiptData = {
  orderNumber: number
  customerName: string
  orderType: "dine_in" | "takeaway"
  tableNumber?: number | null
  createdAt: string
  items: ReceiptItem[]
  totalCents: number
  tipCents?: number
  discountCents?: number
}

export function ReceiptModal({
  open,
  data,
  onClose,
}: {
  open: boolean
  data: ReceiptData | null
  onClose: () => void
}) {
  if (!open || !data) return null

  function handlePrint() {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative flex w-full max-w-sm flex-col items-center gap-4"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 rounded-full bg-stone-900/80 p-2 text-stone-300 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          {/* Thermal Paper Receipt */}
          <div className="w-full rounded-2xl bg-[#faf8f5] p-6 text-stone-900 shadow-2xl font-mono text-xs">
            {/* Top jagged/torn paper simulation */}
            <div className="flex flex-col items-center text-center border-b border-dashed border-stone-400 pb-4">
              <span className="font-display text-xl font-black tracking-tight text-stone-900">
                KIWU CLUB
              </span>
              <span className="text-[10px] uppercase text-stone-600">
                Specialty Coffee Roasters
              </span>
              <p className="mt-2 text-[11px] text-stone-600">
                {new Date(data.createdAt).toLocaleDateString()} ·{" "}
                {new Date(data.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-3 rounded-md bg-stone-900 px-3 py-1 text-white text-base font-bold tracking-wider">
                ORDER #{data.orderNumber}
              </div>
              <p className="mt-2 text-sm font-bold text-stone-800">
                Guest: {data.customerName}
              </p>
              <p className="text-[11px] font-semibold text-stone-600 uppercase">
                {data.orderType === "dine_in"
                  ? `Dine In — Table ${data.tableNumber ?? 1}`
                  : "Take Away"}
              </p>
            </div>

            {/* Line items */}
            <div className="py-4 border-b border-dashed border-stone-400">
              <div className="flex justify-between font-bold text-[11px] pb-2 text-stone-700 uppercase">
                <span>Qty Item</span>
                <span>Price</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {data.items.map((item, idx) => (
                  <li key={idx} className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">
                        {item.quantity}× {item.name}
                      </span>
                      {item.unitCents ? (
                        <span>{formatPrice(item.unitCents * item.quantity)}</span>
                      ) : null}
                    </div>
                    {item.options && item.options.length > 0 && (
                      <span className="text-[10px] text-stone-600 pl-4">
                        + {item.options.join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Total calculation */}
            <div className="py-3 flex flex-col gap-1.5 border-b border-dashed border-stone-400">
              {data.discountCents ? (
                <div className="flex justify-between text-stone-600">
                  <span>Discount</span>
                  <span>-{formatPrice(data.discountCents)}</span>
                </div>
              ) : null}
              {data.tipCents ? (
                <div className="flex justify-between text-stone-600">
                  <span>Barista Tip</span>
                  <span>+{formatPrice(data.tipCents)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-bold pt-1 text-stone-900">
                <span>TOTAL</span>
                <span>{formatPrice(data.totalCents)}</span>
              </div>
            </div>

            {/* Footer Barcode */}
            <div className="pt-4 flex flex-col items-center gap-2 text-center text-[10px] text-stone-500">
              <div className="h-10 w-44 tracking-widest flex items-center justify-center font-bold font-mono text-xl text-stone-800 border-y border-stone-300">
                || | ||| || ||| | ||
              </div>
              <p>Thank you for visiting Kiwu Club!</p>
              <a
                href={`/status/${data.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] font-bold text-stone-800 hover:underline"
              >
                /status/{data.orderNumber}
              </a>
              <p className="text-[9px] opacity-75">Bar & Kitchen Dispatch Slip</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl bg-card text-foreground"
            >
              Close
            </Button>
            <Button
              asChild
              variant="secondary"
              className="flex-1 rounded-xl font-semibold"
            >
              <a
                href={`/status/${data.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Live Tracker
              </a>
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 rounded-xl gap-2 font-semibold shadow-lifted"
            >
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
