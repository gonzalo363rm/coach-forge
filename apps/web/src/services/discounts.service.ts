import { Prisma } from "@prisma/client"
import type { CatalogStatus, Discount } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import type { DiscountCreateInput, DiscountListSortBy, DiscountUpdateInput } from "@/schemas/billing.schema"
import type { CatalogMutationResult } from "@/services/plans.service"

type DiscountStatusUpdateInput = {
    id: string
    status: CatalogStatus
}

export type DiscountListItem = Omit<Discount, "value"> & { value: string }

export type DiscountsPaginatedData = {
    currentPage: number
    totalPages: number
    discounts: DiscountListItem[]
}

function toDecimal(value: string): Prisma.Decimal {
    return new Prisma.Decimal(value)
}

function mapDiscount(discount: Discount): DiscountListItem {
    return { ...discount, value: discount.value.toString() }
}

function discountListOrderBy(
    sortBy: DiscountListSortBy,
    sortDir: "asc" | "desc",
): Prisma.DiscountOrderByWithRelationInput {
    switch (sortBy) {
        case "type":
            return { type: sortDir }
        case "status":
            return { status: sortDir }
        case "createdAt":
            return { createdAt: sortDir }
        case "name":
        default:
            return { name: sortDir }
    }
}

export async function discountGetById(id: string): Promise<DiscountListItem | null> {
    const discount = await getPrisma().discount.findUnique({ where: { id } })
    if (!discount) return null
    return mapDiscount(discount)
}

export async function discountsListActive(): Promise<DiscountListItem[]> {
    const discounts = await getPrisma().discount.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
    })
    return discounts.map(mapDiscount)
}

export async function discountsListPaginated(
    page: number,
    take: number,
    filters: { search?: string | null; status?: CatalogStatus | null },
    sort: { sortBy: DiscountListSortBy; sortDir: "asc" | "desc" },
): Promise<CatalogMutationResult<DiscountsPaginatedData>> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

    const where: Prisma.DiscountWhereInput = {}
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { code: { contains: filters.search, mode: "insensitive" } },
        ]
    }
    if (filters.status) where.status = filters.status

    try {
        const [discounts, total] = await Promise.all([
            getPrisma().discount.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: discountListOrderBy(sort.sortBy, sort.sortDir),
                where,
            }),
            getPrisma().discount.count({ where }),
        ])

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages: Math.max(1, Math.ceil(total / safeTake)),
                discounts: discounts.map(mapDiscount),
            },
        }
    } catch (e) {
        console.error("[discountsListPaginated]", e)
        return { ok: false, error: "Error al obtener los descuentos" }
    }
}

function isUniqueCodeError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function discountCreate(
    input: DiscountCreateInput,
): Promise<CatalogMutationResult<Discount>> {
    try {
        const discount = await getPrisma().discount.create({
            data: {
                name: input.name,
                type: input.type,
                value: toDecimal(input.value),
                code: input.code,
                validFrom: input.validFrom,
                validUntil: input.validUntil,
                maxUses: input.maxUses,
                status: input.status,
            },
        })
        return { ok: true, data: discount }
    } catch (e) {
        if (isUniqueCodeError(e)) {
            return { ok: false, error: "Ya existe un descuento con ese código" }
        }
        console.error("[discountCreate]", e)
        return { ok: false, error: "Error al crear el descuento" }
    }
}

export async function discountUpdate(
    input: DiscountUpdateInput,
): Promise<CatalogMutationResult<Discount>> {
    try {
        const current = await getPrisma().discount.findUnique({ where: { id: input.id } })
        if (!current) return { ok: false, error: "Descuento no encontrado" }

        const discount = await getPrisma().discount.update({
            where: { id: input.id },
            data: {
                name: input.name,
                type: input.type,
                value: toDecimal(input.value),
                code: input.code,
                validFrom: input.validFrom,
                validUntil: input.validUntil,
                maxUses: input.maxUses,
                status: input.status,
            },
        })
        return { ok: true, data: discount }
    } catch (e) {
        if (isUniqueCodeError(e)) {
            return { ok: false, error: "Ya existe un descuento con ese código" }
        }
        console.error("[discountUpdate]", e)
        return { ok: false, error: "Error al actualizar el descuento" }
    }
}

export async function discountUpdateStatus(
    input: DiscountStatusUpdateInput,
): Promise<CatalogMutationResult<Discount>> {
    try {
        const discount = await getPrisma().discount.update({
            where: { id: input.id },
            data: { status: input.status },
        })
        return { ok: true, data: discount }
    } catch (e) {
        console.error("[discountUpdateStatus]", e)
        return { ok: false, error: "Error al cambiar el estado del descuento" }
    }
}
