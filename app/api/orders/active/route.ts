import { NextResponse } from "next/server"
import { getActiveOrders } from "@/lib/orders"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const orders = await getActiveOrders()
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
