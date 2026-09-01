"use server"

import { z } from "zod"

import { requireSuperadmin } from "@/lib/require-superadmin"
import {
    getPlansPaginatedParamsSchema,
    planCreateSchema,
    planStatusUpdateSchema,
    planUpdateSchema,
} from "@/schemas/billing.schema"
import {
    planCreate,
    planGetById,
    plansListPaginated,
    planUpdate,
    planUpdateStatus,
    permissionsListActive,
    type PlanDetail,
    type PlansPaginatedData,
} from "@/services/plans.service"
import type { Permission } from "@prisma/client"

import { revalidateBillingViews } from "./revalidate-billing"
import type { BillingActionResult } from "./types"

function validationError(error: z.ZodError): BillingActionResult<never> {
    const issues = error.issues
    return {
        ok: false,
        error: issues.map((issue) => issue.message).filter(Boolean).join(" ") || "Validación fallida",
        details: z.treeifyError(error),
    }
}

export async function getPlansPaginatedAction(
    input: unknown,
): Promise<BillingActionResult<PlansPaginatedData>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = getPlansPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) return validationError(parsed.error)

    const { page, take, filters, sortBy, sortDir } = parsed.data
    return plansListPaginated(page, take, filters ?? {}, { sortBy, sortDir })
}

export async function getPlanByIdAction(id: string): Promise<BillingActionResult<PlanDetail>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth
    const plan = await planGetById(id)
    if (!plan) return { ok: false, error: "Plan no encontrado" }
    return { ok: true, data: plan }
}

export async function getActivePermissionsAction(): Promise<BillingActionResult<Permission[]>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth
    const permissions = await permissionsListActive()
    return { ok: true, data: permissions }
}

export async function createPlanAction(input: unknown): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = planCreateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await planCreate(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews()
    return { ok: true, data: { id: result.data.id } }
}

export async function updatePlanAction(input: unknown): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = planUpdateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await planUpdate(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews(result.data.id)
    return { ok: true, data: { id: result.data.id } }
}

export async function updatePlanStatusAction(
    input: unknown,
): Promise<BillingActionResult<{ id: string }>> {
    const auth = await requireSuperadmin()
    if (!auth.ok) return auth

    const parsed = planStatusUpdateSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error)

    const result = await planUpdateStatus(parsed.data)
    if (!result.ok) return result

    revalidateBillingViews(result.data.id)
    return { ok: true, data: { id: result.data.id } }
}
