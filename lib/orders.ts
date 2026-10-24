import type { OrderStatus } from "@/lib/actions/orders"
import { createClient } from "@/lib/supabase/server"

export type ActiveOrder = {
  id: string
  order_number: number
  customer_name: string
  order_type: "dine_in" | "takeaway"
  status: OrderStatus
  total_cents: number
  created_at: string
  table_number?: number | null
  pickup_at?: string | null
  note?: string | null
  tip_cents?: number
  discount_cents?: number
  discount_code?: string | null
  payment_method?: string
  phone?: string | null
  order_items: {
    id: number
    product_name: string
    quantity: number
    order_item_options: { id: number; option_name: string }[]
  }[]
}

// Orders still being worked on, oldest first.
export async function getActiveOrders(): Promise<ActiveOrder[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, customer_name, order_type, status, total_cents, created_at,
       table_number, pickup_at, note, tip_cents, discount_cents, discount_code, payment_method, phone,
       order_items (id, product_name, quantity, order_item_options (id, option_name))`
    )
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: true })
    .order("id", { referencedTable: "order_items", ascending: true })

  if (error) throw error

  return data as unknown as ActiveOrder[]
}

export async function getCustomerOrders(): Promise<ActiveOrder[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, customer_name, order_type, status, total_cents, created_at,
       order_items (id, product_name, quantity, order_item_options (id, option_name))`
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as ActiveOrder[]
}
