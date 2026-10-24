import type { SelectedOption } from "@/components/kiosk/product-dialog"
import type { Product } from "@/lib/menu"

export type CartLine = {
  key: string
  product: Product
  options: SelectedOption[]
  quantity: number
}

export const MAX_QUANTITY = 20

export const unitCents = (line: CartLine) =>
  line.product.price_cents +
  line.options.reduce((sum, option) => sum + option.price_delta_cents, 0)

export const lineCents = (line: CartLine) => unitCents(line) * line.quantity
