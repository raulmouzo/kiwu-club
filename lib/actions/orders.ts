"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type OrderType = "dine_in" | "takeaway"

export type CreateOrderInput = {
  customerName: string
  orderType: OrderType
  items: { productId: number; quantity: number; optionIds: number[] }[]
  tableNumber?: number | null
  pickupAt?: string | null
  tipCents?: number
  discountCode?: string | null
  paymentMethod?: "card" | "cash"
  note?: string | null
  phone?: string | null
  redeemReward?: boolean
}

export type CreateOrderResult =
  | { ok: true; orderNumber: number }
  | { ok: false; error: string }

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
    p_table_number:
      input.orderType === "dine_in" ? (input.tableNumber ?? 1) : null,
    p_pickup_at: input.pickupAt ?? null,
    p_tip_cents: input.tipCents ?? 0,
    p_discount_code: input.discountCode ?? null,
    p_payment_method: input.paymentMethod ?? "card",
    p_note: input.note ?? null,
    p_phone: input.phone ?? null,
    p_redeem_reward: input.redeemReward ?? false,
  })

  if (error) {
    if (error.code === "42501") {
      return { ok: false, error: "This device is not allowed to place orders." }
    }
    if (error.code === "P0001") {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Could not place the order. Please try again." }
  }

  revalidatePath("/staff")
  return { ok: true, orderNumber: (data as { order_number: number }).order_number }
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = await createClient()
  await supabase.from("orders").update({ status }).eq("id", orderId)
  revalidatePath("/staff")
  revalidatePath("/status")
}

export type PublicOrderStatus = {
  order_number: number
  customer_name: string
  status: OrderStatus
  created_at: string
  total_cents: number
  table_number: number | null
  pickup_at: string | null
  queue_ahead: number
  items: {
    name: string
    quantity: number
    options: string[]
  }[]
}

export async function getOrderStatusAction(
  orderNumber: number
): Promise<PublicOrderStatus | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_order_status", {
    p_number: orderNumber,
  })
  if (error || !data) return null
  return data as unknown as PublicOrderStatus
}

export type ReadyOrder = {
  order_number: number
  customer_name: string
  ready_at: string
}

export async function getReadyOrdersAction(): Promise<ReadyOrder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("ready_orders")
  if (error || !data) return []
  return data as ReadyOrder[]
}

export async function toggleProductAvailability(
  productId: number,
  isAvailable: boolean
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId)

  if (error) return { ok: false }
  revalidatePath("/kiosk")
  revalidatePath("/staff")
  return { ok: true }
}

export type OrderHistoryItem = {
  id: string
  order_number: number
  customer_name: string
  order_type: "dine_in" | "takeaway"
  status: OrderStatus
  total_cents: number
  created_at: string
  updated_at: string
}

export async function getOrderHistoryAction(): Promise<OrderHistoryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, order_type, status, total_cents, created_at, updated_at")
    .in("status", ["completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(30)

  if (error || !data) return []
  return data as OrderHistoryItem[]
}

export async function validateDiscountCodeAction(
  code: string,
  subtotalCents: number
): Promise<{ ok: boolean; discountCents: number; message?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("active", true)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, discountCents: 0, message: "Código no encontrado" }
  }

  if (data.min_cents && subtotalCents < data.min_cents) {
    return {
      ok: false,
      discountCents: 0,
      message: `Gasto mínimo de ${(data.min_cents / 100).toFixed(2)}€`,
    }
  }

  const discount =
    data.kind === "percent"
      ? Math.floor((subtotalCents * data.value) / 100)
      : data.value

  return { ok: true, discountCents: Math.min(discount, subtotalCents) }
}

export type LoyaltyInfo = {
  phone: string
  stamps: number
  rewards: number
}

export async function getLoyaltyStatusAction(
  phone: string
): Promise<LoyaltyInfo | null> {
  const clean = phone.replace(/\D/g, "")
  if (clean.length !== 9) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("loyalty_status", {
    p_phone: clean,
  })

  if (error || !data) return null
  return data as LoyaltyInfo
}

export async function getCurrentHappyHourAction(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("current_happy_hour")
  if (error || !data) return 0
  return Number(data)
}

