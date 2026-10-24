"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type OrderType = "dine_in" | "takeaway"

export type CreateOrderInput = {
  customerName: string
  orderType: OrderType
  items: { productId: number; quantity: number; optionIds: number[] }[]
}

export type CreateOrderResult =
  | { ok: true; orderNumber: number }
  | { ok: false; error: string }

// Prices are computed in the database; the client only sends ids and quantities.
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: input.customerName,
    p_order_type: input.orderType,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      option_ids: item.optionIds,
    })),
  })

  if (error) {
    // 42501: not a kiosk/staff session. P0001: validation raised by create_order.
    if (error.code === "42501") {
      return { ok: false, error: "This device is not allowed to place orders." }
    }
    if (error.code === "P0001") {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Could not place the order. Please try again." }
  }

  return { ok: true, orderNumber: (data as { order_number: number }).order_number }
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"

// RLS only lets staff update orders, and a trigger rejects invalid
// transitions. If two staff race on the same order the loser is a no-op:
// the refresh below shows the real state.
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = await createClient()
  await supabase.from("orders").update({ status }).eq("id", orderId)
  revalidatePath("/staff")
}
