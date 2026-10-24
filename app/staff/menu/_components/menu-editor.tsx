"use client"

import {
  Check,
  Flame,
  Leaf,
  Milk,
  Plus,
  Search,
  Snowflake,
  Wheat,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createProductAction,
  updateProductPrice,
} from "@/lib/actions/menu"
import { toggleProductAvailability } from "@/lib/actions/orders"
import { formatPrice } from "@/lib/format"
import type { Category, Product } from "@/lib/menu"
import { cn } from "@/lib/utils"

export function MenuEditor({ initialMenu }: { initialMenu: Category[] }) {
  const [menu, setMenu] = useState<Category[]>(initialMenu)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all")
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [priceInput, setPriceInput] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [pending, startTransition] = useTransition()

  // New product form state
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newCategoryId, setNewCategoryId] = useState<number>(menu[0]?.id ?? 1)
  const [newDietary, setNewDietary] = useState<string[]>([])

  function handleToggleStock(productId: number, currentAvailable: boolean) {
    const next = !currentAvailable

    // Optimistic update
    setMenu((prev) =>
      prev.map((cat) => ({
        ...cat,
        products: cat.products.map((p) =>
          p.id === productId ? { ...p, is_available: next } : p
        ),
      }))
    )

    startTransition(async () => {
      await toggleProductAvailability(productId, next)
    })
  }

  function handleSavePrice(productId: number) {
    const parsed = Math.round(parseFloat(priceInput.replace(",", ".")) * 100)
    if (isNaN(parsed) || parsed < 0) return

    // Optimistic update
    setMenu((prev) =>
      prev.map((cat) => ({
        ...cat,
        products: cat.products.map((p) =>
          p.id === productId ? { ...p, price_cents: parsed } : p
        ),
      }))
    )

    setEditingPriceId(null)
    startTransition(async () => {
      await updateProductPrice(productId, parsed)
    })
  }

  function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    const cents = Math.round(parseFloat(newPrice.replace(",", ".")) * 100)
    if (!newName.trim() || isNaN(cents) || cents < 0) return

    startTransition(async () => {
      const res = await createProductAction({
        category_id: newCategoryId,
        name: newName.trim(),
        price_cents: cents,
        dietary: newDietary,
      })

      if (res.ok && res.id) {
        const created: Product = {
          id: res.id,
          name: newName.trim(),
          description: null,
          price_cents: cents,
          image_url: null,
          is_available: true,
          sort_order: 99,
          dietary: newDietary,
          allergens: [],
          groups: [],
        }

        setMenu((prev) =>
          prev.map((cat) =>
            cat.id === newCategoryId
              ? { ...cat, products: [...cat.products, created] }
              : cat
          )
        )

        setIsAdding(false)
        setNewName("")
        setNewPrice("")
        setNewDietary([])
      }
    })
  }

  const allProducts = menu.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, categoryName: cat.name, categoryId: cat.id }))
  )

  const filteredProducts = allProducts.filter((product) => {
    const matchesCat =
      selectedCategory === "all" || product.categoryId === selectedCategory
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Menu Management & 86 List
          </h1>
          <p className="text-sm text-muted-foreground">
            Instantly toggle sold-out items (86 list) and adjust prices live.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(true)}
          className="rounded-2xl gap-2 font-semibold shadow-lifted"
        >
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-3 border border-border shadow-soft">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Items
          </button>
          {menu.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drinks or food…"
            className="h-9 rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const isEditing = editingPriceId === product.id

          return (
            <div
              key={product.id}
              className={cn(
                "flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all",
                !product.is_available
                  ? "border-destructive/30 bg-destructive/[0.02] opacity-85"
                  : "border-border/80"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    {!product.is_available && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive uppercase">
                        86'd
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {product.categoryName}
                  </span>

                  {/* Dietary pills with clean Lucide icons */}
                  {product.dietary && product.dietary.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.dietary.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize"
                        >
                          {d === "vegan" && <Leaf className="size-2.5" />}
                          {d === "lactose_free" && <Milk className="size-2.5" />}
                          {d === "cold" && <Snowflake className="size-2.5" />}
                          {d === "hot" && <Flame className="size-2.5" />}
                          <span>{d.replace("_", "-")}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 86 Fast Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleStock(product.id, product.is_available)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                    product.is_available
                      ? "bg-success/15 text-success hover:bg-success/25"
                      : "bg-destructive text-destructive-foreground shadow-sm"
                  )}
                >
                  {product.is_available ? "In Stock" : "86'd"}
                </button>
              </div>

              {/* Price & Edit Price */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">€</span>
                    <Input
                      autoFocus
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="h-8 w-20 rounded-lg text-xs font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleSavePrice(product.id)}
                      className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPriceId(null)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPriceId(product.id)
                      setPriceInput((product.price_cents / 100).toFixed(2))
                    }}
                    className="font-mono text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Click to edit price"
                  >
                    {formatPrice(product.price_cents)}
                    <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                      (edit)
                    </span>
                  </button>
                )}

                <span className="text-[11px] text-muted-foreground">
                  {product.is_available ? "Ready on kiosk" : "Hidden from kiosk"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-card p-6 shadow-floating border border-border"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-xl font-bold">Add New Item</h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <Input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Iced Vanilla Latte"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Category
                    </label>
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(Number(e.target.value))}
                      className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium"
                    >
                      {menu.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Price (€)
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.05"
                      min="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="3.80"
                      className="h-11 rounded-xl text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Dietary checkboxes with icons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dietary Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "vegan", label: "Vegan", icon: Leaf },
                      { id: "lactose_free", label: "Lactose-free", icon: Milk },
                      { id: "gluten_free", label: "Gluten-free", icon: Wheat },
                      { id: "cold", label: "Cold", icon: Snowflake },
                      { id: "hot", label: "Hot", icon: Flame },
                    ].map((tag) => {
                      const Icon = tag.icon
                      const checked = newDietary.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setNewDietary((prev) =>
                              checked
                                ? prev.filter((d) => d !== tag.id)
                                : [...prev, tag.id]
                            )
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
                            checked
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border border-border bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="size-3" />
                          <span>{tag.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={pending}
                    className="flex-1 rounded-xl font-semibold shadow-lifted"
                  >
                    {pending ? "Adding…" : "Save Item"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
