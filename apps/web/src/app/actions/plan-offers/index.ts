"use server"

import { z } from "zod"

import { requireSuperadmin } from "@/lib/require-superadmin"
import {
    planOfferCreateSchema,
    planOfferStatusUpdateSchema,
    planOfferUpdateSchema,
    previewOfferPriceSchema,
} from "@/schemas/billing.schema"
import {
    planOfferCreate,
    planOfferGetById,
    planOfferUpdate,
    planOfferUpdateStatus,
    previewOfferPrice,
    type OfferPricePreview,
    type PlanOfferDetail,
} from "@/services/plan-offers.service"

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

export async function getPlanOfferByIdAction(
    id: string,
): Promise<BillingActionResult<PlanOfferDetail>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth
    const offer = await planOfferGetById(id)
    if (!offer) return { ok: false, error: "Oferta no encontrada" }
    return { ok: true, data: offer }
}

export async function createPlanOfferAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string; planId: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = planOfferCreateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await planOfferCreate(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews(result.data.planId)
    return { ok: true, data: { id: result.data.id, planId: result.data.planId } }
}

export async function updatePlanOfferAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string; planId: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = planOfferUpdateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await planOfferUpdate(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews(result.data.planId)
    return { ok: true, data: { id: result.data.id, planId: result.data.planId } }
}

export async function updatePlanOfferStatusAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = planOfferStatusUpdateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await planOfferUpdateStatus(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews(result.data.planId)
    return { ok: true, data: { id: result.data.id } }
}

export async function previewOfferPriceAction(
    input: unknown,
): Promise<BillingActionResult<OfferPricePreview>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = previewOfferPriceSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    return previewOfferPrice(parsed.data)
}
