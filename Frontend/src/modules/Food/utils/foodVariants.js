const toArray = (value) => (Array.isArray(value) ? value : [])

export const normalizeFoodVariants = (value) =>
  toArray(value)
    .map((entry = {}, index) => {
      const id = String(entry?.id || entry?._id || `variant-${index}`)
      const name = String(entry?.name || "").trim()
      const price = Number(entry?.price)
      if (!name || !Number.isFinite(price) || price <= 0) return null

      return {
        id,
        _id: id,
        name,
        price,
      }
    })
    .filter(Boolean)

export const getFoodVariants = (item = {}) =>
  normalizeFoodVariants(item?.variants || item?.variations || [])

export const hasFoodVariants = (item = {}) => getFoodVariants(item).length > 0

// Returns null by default — null means "base item is selected" (not any variant)
export const getDefaultFoodVariant = (item = {}) => null

export const getFoodDisplayPrice = (item = {}) => {
  const variants = getFoodVariants(item)
  const basePrice = Number(item?.price)
  const validBase = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : null

  if (variants.length > 0) {
    // FIXED: Include base price in the minimum calculation so "Starting from"
    // always reflects the lowest of (base price, all variant prices).
    const variantPrices = variants.map((v) => Number(v.price)).filter((p) => p > 0)
    const allPrices = validBase !== null ? [validBase, ...variantPrices] : variantPrices
    return allPrices.length > 0 ? Math.min(...allPrices) : 0
  }

  return validBase ?? 0
}

export const getFoodPriceLabel = (item = {}) => {
  const price = getFoodDisplayPrice(item)
  return hasFoodVariants(item) ? `Starting from ₹${Math.round(price)}` : `₹${Math.round(price)}`
}

export const buildCartLineId = (itemId, variantId = "") =>
  `${String(itemId || "")}::${String(variantId || "base")}`
