export type DiscountForPrice = {
    type: "percentage" | "fixed"
    value: number
}

export type PriceBreakdown = {
    originalPrice: number
    discountAmount: number
    finalPrice: number
}

export function roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100
}

export function applyDiscounts(
    originalPrice: number,
    discounts: DiscountForPrice[],
): PriceBreakdown {
    const original = roundMoney(Math.max(0, originalPrice))
    if (discounts.length === 0) {
        return { originalPrice: original, discountAmount: 0, finalPrice: original }
    }

    let discountAmount = 0
    for (const discount of discounts) {
        const rawValue = Number(discount.value)
        const piece =
            discount.type === "percentage" ? original * (rawValue / 100) : rawValue
        discountAmount += Math.max(0, piece)
    }

    discountAmount = roundMoney(Math.min(discountAmount, original))

    return {
        originalPrice: original,
        discountAmount,
        finalPrice: roundMoney(original - discountAmount),
    }
}

export function applyDiscount(
    originalPrice: number,
    discount: DiscountForPrice | null,
): PriceBreakdown {
    return applyDiscounts(originalPrice, discount ? [discount] : [])
}

export function isCatalogWindowValid(
    item: {
        status: "active" | "inactive"
        validFrom?: Date | null
        validUntil?: Date | null
    },
    now = new Date(),
): boolean {
    if (item.status !== "active") return false
    if (item.validFrom && now < item.validFrom) return false
    if (item.validUntil && now > item.validUntil) return false
    return true
}

export function formatMoneyArs(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount)
}

export type OfferForDurationPricing = {
    price: string | number
    durationValue: number
    durationUnit: "month" | "year"
    discounts: DiscountForPrice[]
}

export function getOfferFinalPrice(offer: {
    price: string | number
    discounts: DiscountForPrice[]
}): number {
    return applyDiscounts(Number(offer.price), offer.discounts).finalPrice
}

export function getPlanFinalPriceForDuration(
    offers: OfferForDurationPricing[],
    duration: Pick<OfferForDurationPricing, "durationValue" | "durationUnit"> | null,
): number | null {
    if (!duration) return null

    const matches = offers.filter(
        (offer) =>
            offer.durationValue === duration.durationValue &&
            offer.durationUnit === duration.durationUnit,
    )
    if (matches.length === 0) return null

    return Math.min(...matches.map((offer) => getOfferFinalPrice(offer)))
}
