"use client"

import { Printer, Search } from "lucide-react"
import { useState } from "react"

import { ReceiptModal } from "../../_components/receipt-modal"
import type { OrderHistoryItem } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export function OrderHistoryView({
  initialHistory,
}: {
  initialHistory: OrderHistoryItem[]
}) {
  const [history] = useState<OrderHistoryItem[]>(initialHistory)
  const [search, setSearch] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState<OrderHistoryItem | null>(null)

  const filtered = history.filter(
    (order) =>
      order.order_number.toString().includes(search) ||
      order.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Order History
          </h1>
          <p className="text-sm text-muted-foreground">
            Lookup completed and cancelled tickets, and re-print receipts.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or guest name…"
            className="h-10 rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <p className="text-base font-semibold">No orders found</p>
          <p className="text-xs">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">
                    #{order.order_number}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {order.customer_name}
                  </td>
                  <td className="p-4 text-xs font-medium text-muted-foreground">
                    {order.order_type === "dine_in" ? "Dine in" : "Take away"}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground font-mono">
                    {new Date(order.created_at).toLocaleDateString()} ·{" "}
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
                        order.status === "completed"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-foreground">
                    {formatPrice(order.total_cents)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(order)}
                      aria-label="Re-print receipt"
                      title="Re-print thermal ticket"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
                    >
                      <Printer className="size-3.5" />
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal
          open={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          data={{
            orderNumber: selectedReceipt.order_number,
            customerName: selectedReceipt.customer_name,
            orderType: selectedReceipt.order_type,
            createdAt: selectedReceipt.created_at,
            totalCents: selectedReceipt.total_cents,
            items: [
              {
                name: "Order items (dispatched)",
                quantity: 1,
                unitCents: selectedReceipt.total_cents,
              },
            ],
          }}
        />
      )}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        props.className
      )}
    />
  )
}
