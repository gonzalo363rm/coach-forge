import { Prisma } from "@prisma/client"
import type { CatalogStatus, Discount, PlanOffer } from "@prisma/client"

import { applyDiscount, isCatalogWindowValid } from "@/lib/plan-pricing"
import { getPrisma } from "@/lib/prisma"
import type {
    PlanOfferCreateInput,
    PlanOfferUpdateInput,
    PreviewOfferPriceInput,
} from "@/schemas/billing.schema"
import type { CatalogMutationResult } from "@/services/plans.service"

type PlanOfferStatusUpdateInput = {
    id: string
    status: CatalogStatus
}

export type PlanOfferDetail = Omit<PlanOffer, "price"> & {
    price: string
    discountIds: string[]
    discounts: Array<{
        id: string
        name: string
        type: Discount["type"]
        value: string
        code: string | null
        status: CatalogStatus
        validFrom: Date | null
        validUntil: Date | null
    }>
}

function toDecimal(value: string): Prisma.Decimal {
    return new Prisma.Decimal(value)
}

async function replaceOfferDiscounts(
    tx: Prisma.TransactionClient,
    planOfferId: string,
    discountIds: string[],
) {
    const uniqueIds = [...new Set(discountIds)]
    if (uniqueIds.length > 0) {
        const found = await tx.discount.count({ where: { id: { in: uniqueIds } } })
        if (found !== uniqueIds.length) {
            throw new Error("INVALID_DISCOUNTS")
        }
    }

    await tx.planOfferDiscount.deleteMany({ where: { planOfferId } })
    if (uniqueIds.length === 0) return

    await tx.planOfferDiscount.createMany({
        data: uniqueIds.map((discountId) => ({ planOfferId, discountId })),
    })
}

function mapOffer(
    offer: PlanOffer & {
        discounts: Array<{ discount: Discount }>
    },
): PlanOfferDetail {
    return {
        ...offer,
        price: offer.price.toString(),
        discountIds: offer.discounts.map((row) => row.discount.id),
        discounts: offer.discounts.map((row) => ({
            id: row.discount.id,
            name: row.discount.name,
            type: row.discount.type,
            value: row.discount.value.toString(),
            code: row.discount.code,
            status: row.discount.status,
            validFrom: row.discount.validFrom,
            validUntil: row.discount.validUntil,
        })),
    }
}

export async function planOfferGetById(id: string): Promise<PlanOfferDetail | null> {
    const offer = await getPrisma().planOffer.findUnique({
        where: { id },
        include: { discounts: { include: { discount: true } } },
    })
    if (!offer) return null
    return mapOffer(offer)
}

export async function planOfferCreate(
    input: PlanOfferCreateInput,
): Promise<CatalogMutationResult<PlanOffer>> {
    try {
        const plan = await getPrisma().plan.findUnique({ where: { id: input.planId } })
        if (!plan) return { ok: false, error: "Plan no encontrado" }

        const offer = await getPrisma().$transaction(async (tx) => {
            const created = await tx.planOffer.create({
                data: {
                    planId: input.planId,
                    name: input.name,
                    durationValue: input.durationValue,
                    durationUnit: input.durationUnit,
                    price: toDecimal(input.price),
                    currency: input.currency || "ARS",
                    validFrom: input.validFrom,
                    validUntil: input.validUntil,
                    status: input.status,
                },
            })
            await replaceOfferDiscounts(tx, created.id, input.discountIds)
            return created
        })
        return { ok: true, data: offer }
    } catch (e) {
        if (e instanceof Error && e.message === "INVALID_DISCOUNTS") {
            return { ok: false, error: "Hay descuentos inválidos" }
        }
        console.error("[planOfferCreate]", e)
        return { ok: false, error: "Error al crear la oferta" }
    }
}

export async function planOfferUpdate(
    input: PlanOfferUpdateInput,
): Promise<CatalogMutationResult<PlanOffer>> {
    try {
        const current = await getPrisma().planOffer.findUnique({ where: { id: input.id } })
        if (!current) return { ok: false, error: "Oferta no encontrada" }
        if (current.planId !== input.planId) {
            return { ok: false, error: "La oferta no pertenece a este plan" }
        }

        const offer = await getPrisma().$transaction(async (tx) => {
            const updated = await tx.planOffer.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    durationValue: input.durationValue,
                    durationUnit: input.durationUnit,
                    price: toDecimal(input.price),
                    currency: input.currency || "ARS",
                    validFrom: input.validFrom,
                    validUntil: input.validUntil,
                    status: input.status,
                },
            })
            await replaceOfferDiscounts(tx, updated.id, input.discountIds)
            return updated
        })
        return { ok: true, data: offer }
    } catch (e) {
        if (e instanceof Error && e.message === "INVALID_DISCOUNTS") {
            return { ok: false, error: "Hay descuentos inválidos" }
        }
        console.error("[planOfferUpdate]", e)
        return { ok: false, error: "Error al actualizar la oferta" }
    }
}

export async function planOfferUpdateStatus(
    input: PlanOfferStatusUpdateInput,
): Promise<CatalogMutationResult<PlanOffer>> {
    try {
        const offer = await getPrisma().planOffer.update({
            where: { id: input.id },
            data: { status: input.status },
        })
        return { ok: true, data: offer }
    } catch (e) {
        console.error("[planOfferUpdateStatus]", e)
        return { ok: false, error: "Error al cambiar el estado de la oferta" }
    }
}

export type OfferPricePreview = {
    originalPrice: number
    discountAmount: number
    finalPrice: number
    discountName: string | null
}

export async function previewOfferPrice(
    input: PreviewOfferPriceInput,
): Promise<CatalogMutationResult<OfferPricePreview>> {
    const offer = await getPrisma().planOffer.findUnique({
        where: { id: input.planOfferId },
        include: { discounts: { include: { discount: true } } },
    })
    if (!offer) return { ok: false, error: "Oferta no encontrada" }

    const originalPrice = Number(offer.price.toString())
    const associated = offer.discounts.map((row) => row.discount)
    const code = input.code?.trim().toUpperCase() || ""
    const discountId = input.discountId?.trim() || ""

    let selected = associated.find((discount) => {
        if (discountId) return discount.id === discountId
        if (code) return discount.code === code
        return false
    })

    if (!discountId && !code) {
        selected = associated.find(
            (discount) => !discount.code && isCatalogWindowValid(discount),
        )
    }

    if ((discountId || code) && !selected) {
        return { ok: false, error: "El descuento no está asociado a esta oferta" }
    }

    if (selected && !isCatalogWindowValid(selected)) {
        return { ok: false, error: "El descuento no está vigente" }
    }

    if (selected?.code && !code && discountId) {
        // Cupón asociado elegido desde el form: se puede previsualizar.
    }

    const breakdown = applyDiscount(
        originalPrice,
        selected
            ? { type: selected.type, value: Number(selected.value.toString()) }
            : null,
    )

    return {
        ok: true,
        data: {
            ...breakdown,
            discountName: selected?.name ?? null,
        },
    }
}
