import { createClient } from "@/lib/supabase/server"

export type Option = {
  id: number
  name: string
  price_delta_cents: number
  is_available: boolean
  sort_order: number
}

export type Group = {
  id: number
  name: string
  selection_type: "single" | "multiple"
  is_required: boolean
  sort_order: number
  options: Option[]
}

export type Product = {
  id: number
  name: string
  description: string | null
  price_cents: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  groups: Group[]
}

export type Category = {
  id: number
  name: string
  products: Product[]
}

type RawGroup = Omit<Group, "options"> & { modifier_options: Option[] }
type RawProduct = Omit<Product, "groups"> & {
  product_modifier_groups: { modifier_groups: RawGroup | null }[]
}
type RawCategory = {
  id: number
  name: string
  sort_order: number
  products: RawProduct[]
}

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) =>
  a.sort_order - b.sort_order

export async function getMenu(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select(
      `id, name, sort_order,
       products (
         id, name, description, price_cents, image_url, is_available, sort_order,
         product_modifier_groups (
           modifier_groups (
             id, name, selection_type, is_required, sort_order,
             modifier_options (id, name, price_delta_cents, is_available, sort_order)
           )
         )
       )`
    )
    .order("sort_order")

  if (error) throw error

  return (data as unknown as RawCategory[]).map((category) => ({
    id: category.id,
    name: category.name,
    products: [...category.products].sort(bySortOrder).map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price_cents: product.price_cents,
      image_url: product.image_url,
      is_available: product.is_available,
      sort_order: product.sort_order,
      groups: product.product_modifier_groups
        .flatMap((link) => (link.modifier_groups ? [link.modifier_groups] : []))
        .sort(bySortOrder)
        .map((group) => ({
          id: group.id,
          name: group.name,
          selection_type: group.selection_type,
          is_required: group.is_required,
          sort_order: group.sort_order,
          options: group.modifier_options
            .filter((option) => option.is_available)
            .sort(bySortOrder),
        })),
    })),
  }))
}
