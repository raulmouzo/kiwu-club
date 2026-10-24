const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

// Prices are stored as integer cents.
export function formatPrice(cents: number) {
  return euro.format(cents / 100)
}
