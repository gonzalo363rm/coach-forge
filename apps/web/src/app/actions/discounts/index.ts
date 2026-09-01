"use server"

import { z } from "zod"

import { requireSuperadmin } from "@/lib/require-superadmin"
import {
    discountCreateSchema,
    discountStatusUpdateSchema,
    discountUpdateSchema,
    getDiscountsPaginatedParamsSchema,
} from "@/schemas/billing.schema"
import {
    discountCreate,
    discountGetById,
    discountsListActive,
    discountsListPaginated,
    discountUpdate,
    discountUpdateStatus,
    type DiscountListItem,
    type DiscountsPaginatedData,
} from "@/services/discounts.service"

import { revalidateBillingViews } from "../plans/revalidate-billing"
import type { BillingActionResult } from "../plans/types"

function validationError(error: z.ZodError): BillingActionResult<never> {
    const issues = error.issues
    return {
        ok: false,
        error: issues.map((issue) => issue.message).filter(Boolean).join(" ") || "Validación fallida",
        details: z.treeifyError(error),
    }
}

export async function getDiscountsPaginatedAction(
    input: unknown,
): Promise<BillingActionResult<DiscountsPaginatedData>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = getDiscountsPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) return validationError(parsed.error)

    const { page, take, filters, sortBy, sortDir } = parsed.data
    return discountsListPaginated(page, take, filters ?? {}, { sortBy, sortDir })
}

export async function getActiveDiscountsAction(): Promise<
    BillingActionResult<DiscountListItem[]>
> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth
    const discounts = await discountsListActive()
    return { ok: true, data: discounts }
}

export async function getDiscountByIdAction(
    id: string,
): Promise<BillingActionResult<DiscountListItem>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth
    const discount = await discountGetById(id)
    if (!discount) return { ok: false, error: "Descuento no encontrado" }
    return { ok: true, data: discount }
}

export async function createDiscountAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = discountCreateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await discountCreate(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews()
    return { ok: true, data: { id: result.data.id } }
}

export async function updateDiscountAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = discountUpdateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await discountUpdate(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews()
    return { ok: true, data: { id: result.data.id } }
}

export async function updateDiscountStatusAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = discountStatusUpdateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await discountUpdateStatus(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews()
    return { ok: true, data: { id: result.data.id } }
}
