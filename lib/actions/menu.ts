"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateProductPrice(
  productId: number,
  priceCents: number
): Promise<{ ok: boolean; error?: string }> {
  if (priceCents < 0) return { ok: false, error: "El precio no puede ser negativo" }
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ price_cents: priceCents })
    .eq("id", productId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/kiosk")
  revalidatePath("/staff")
  return { ok: true }
}

export async function updateProductDetails(
  productId: number,
  data: {
    name?: string
    description?: string | null
    price_cents?: number
    is_available?: boolean
    dietary?: string[]
    allergens?: string[]
    prep_seconds?: number
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update(data)
    .eq("id", productId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/kiosk")
  revalidatePath("/staff")
  return { ok: true }
}

export async function createProductAction(data: {
  category_id: number
  name: string
  description?: string
  price_cents: number
  dietary?: string[]
  allergens?: string[]
  prep_seconds?: number
}): Promise<{ ok: boolean; error?: string; id?: number }> {
  const supabase = await createClient()
  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      category_id: data.category_id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price_cents: data.price_cents,
      dietary: data.dietary ?? [],
      allergens: data.allergens ?? [],
      prep_seconds: data.prep_seconds ?? 90,
      is_available: true,
      sort_order: 99,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath("/kiosk")
  revalidatePath("/staff")
  return { ok: true, id: inserted?.id }
}

export async function toggleOptionAvailability(
  optionId: number,
  isAvailable: boolean
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("modifier_options")
    .update({ is_available: isAvailable })
    .eq("id", optionId)

  if (error) return { ok: false }
  revalidatePath("/kiosk")
  revalidatePath("/staff")
  return { ok: true }
}

export async function updateOptionPriceDelta(
  optionId: number,
  deltaCents: number
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("modifier_options")
    .update({ price_delta_cents: deltaCents })
    .eq("id", optionId)

  if (error) return { ok: false }
  revalidatePath("/kiosk")
  revalidatePath("/staff")
  return { ok: true }
}
