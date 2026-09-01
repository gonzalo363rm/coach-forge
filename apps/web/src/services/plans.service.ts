import type {
    CatalogStatus,
    Permission,
    Plan,
    PlanCatalogRole,
    PlanType,
    Prisma,
} from "@prisma/client"

import { permissionAppliesToPlanType } from "@/lib/billing-labels"
import { getPrisma } from "@/lib/prisma"
import type {
    PlanCreateInput,
    PlanListSortBy,
    PlanStatusUpdateInput,
    PlanUpdateInput,
} from "@/schemas/billing.schema"

export type CatalogMutationResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string }

export type PlanPermissionState = {
    permissionId: string
    value: number | null
    permission: Permission
}

export type PlanDetail = Plan & {
    permissions: PlanPermissionState[]
    offers: Array<{
        id: string
        name: string
        durationValue: number
        durationUnit: "month" | "year"
        price: string
        currency: string
        status: CatalogStatus
        validFrom: Date | null
        validUntil: Date | null
        discounts: Array<{
            name: string
            type: "percentage" | "fixed"
            value: string
        }>
    }>
}

export type PlansPaginatedData = {
    currentPage: number
    totalPages: number
    plans: Plan[]
}

function planListOrderBy(
    sortBy: PlanListSortBy,
    sortDir: "asc" | "desc",
): Prisma.PlanOrderByWithRelationInput {
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

export async function permissionsListActive(): Promise<Permission[]> {
    return getPrisma().permission.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
    })
}

function filterPermissionsForPlanType(
    permissions: PlanCreateInput["permissions"],
    planType: PlanType,
    catalog: Permission[],
): PlanCreateInput["permissions"] {
    const byId = new Map(catalog.map((item) => [item.id, item]))
    return permissions.filter((item) => {
        const permission = byId.get(item.permissionId)
        if (!permission || permission.status !== "active") return false
        return permissionAppliesToPlanType(permission.appliesToPlanType, planType)
    })
}

async function replacePlanPermissions(
    tx: Prisma.TransactionClient,
    planId: string,
    planType: PlanType,
    permissions: PlanCreateInput["permissions"],
) {
    const catalog = await tx.permission.findMany({ where: { status: "active" } })
    const allowed = filterPermissionsForPlanType(permissions, planType, catalog)

    await tx.planPermission.deleteMany({ where: { planId } })
    if (allowed.length === 0) return

    await tx.planPermission.createMany({
        data: allowed.map((item) => {
            const permission = catalog.find((row) => row.id === item.permissionId)
            return {
                planId,
                permissionId: item.permissionId,
                value: permission?.valueKind === "flag" ? null : item.value,
            }
        }),
    })
}

async function clearOtherCatalogRoles(
    tx: Prisma.TransactionClient,
    planId: string,
    type: PlanType,
    catalogRole: PlanCatalogRole,
) {
    if (catalogRole === "none") return
    await tx.plan.updateMany({
        where: {
            type,
            catalogRole,
            id: { not: planId },
        },
        data: { catalogRole: "none" },
    })
}

async function assertCanLeaveFreeRole(
    tx: Prisma.TransactionClient,
    plan: { id: string; type: PlanType; catalogRole: PlanCatalogRole; status: CatalogStatus },
    nextRole: PlanCatalogRole,
    nextStatus: CatalogStatus,
): Promise<string | null> {
    const leavingFree =
        plan.catalogRole === "free" && (nextRole !== "free" || nextStatus !== "active")
    if (!leavingFree) return null

    const otherFree = await tx.plan.findFirst({
        where: {
            type: plan.type,
            catalogRole: "free",
            status: "active",
            id: { not: plan.id },
        },
        select: { id: true },
    })
    if (!otherFree) {
        return "Debe haber al menos un plan Free activo de este tipo. Asigná Free a otro plan antes."
    }
    return null
}

function mapPlanDetail(
    plan: Plan & {
        permissions: Array<{ permissionId: string; value: number | null; permission: Permission }>
        offers: Array<{
            id: string
            name: string
            durationValue: number
            durationUnit: "month" | "year"
            price: Prisma.Decimal
            currency: string
            status: CatalogStatus
            validFrom: Date | null
            validUntil: Date | null
            discounts: Array<{
                discount: {
                    name: string
                    type: "percentage" | "fixed"
                    value: Prisma.Decimal
                }
            }>
        }>
    },
): PlanDetail {
    return {
        ...plan,
        permissions: plan.permissions.map((row) => ({
            permissionId: row.permissionId,
            value: row.value,
            permission: row.permission,
        })),
        offers: plan.offers.map((offer) => ({
            id: offer.id,
            name: offer.name,
            durationValue: offer.durationValue,
            durationUnit: offer.durationUnit,
            price: offer.price.toString(),
            currency: offer.currency,
            status: offer.status,
            validFrom: offer.validFrom,
            validUntil: offer.validUntil,
            discounts: offer.discounts.map((row) => ({
                name: row.discount.name,
                type: row.discount.type,
                value: row.discount.value.toString(),
            })),
        })),
    }
}

export async function planGetById(id: string): Promise<PlanDetail | null> {
    const plan = await getPrisma().plan.findUnique({
        where: { id },
        include: {
            permissions: { include: { permission: true } },
            offers: {
                orderBy: { createdAt: "asc" },
                include: { discounts: { include: { discount: true } } },
            },
        },
    })
    if (!plan) return null
    return mapPlanDetail(plan)
}

export async function planGetByCatalogRole(
    type: PlanType,
    catalogRole: Exclude<PlanCatalogRole, "none">,
): Promise<Plan | null> {
    return getPrisma().plan.findFirst({
        where: { type, catalogRole, status: "active" },
    })
}

export type PlanSelectOption = {
    id: string
    name: string
    type: PlanType
    catalogRole: PlanCatalogRole
}

export async function plansListOptionsByType(type: PlanType): Promise<PlanSelectOption[]> {
    return getPrisma().plan.findMany({
        where: { type, status: "active" },
        select: { id: true, name: true, type: true, catalogRole: true },
        orderBy: [{ catalogRole: "desc" }, { name: "asc" }],
    })
}

export async function plansListPaginated(
    page: number,
    take: number,
    filters: { search?: string | null; type?: PlanType | null; status?: CatalogStatus | null },
    sort: { sortBy: PlanListSortBy; sortDir: "asc" | "desc" },
): Promise<CatalogMutationResult<PlansPaginatedData>> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

    const where: Prisma.PlanWhereInput = {}
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
        ]
    }
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status

    try {
        const [plans, total] = await Promise.all([
            getPrisma().plan.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: planListOrderBy(sort.sortBy, sort.sortDir),
                where,
            }),
            getPrisma().plan.count({ where }),
        ])

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages: Math.max(1, Math.ceil(total / safeTake)),
                plans,
            },
        }
    } catch (e) {
        console.error("[plansListPaginated]", e)
        return { ok: false, error: "Error al obtener los planes" }
    }
}

export async function plansListPublicByType(type: PlanType): Promise<
    Array<
        Plan & {
            permissions: Array<{
                code: string
                name: string
                valueKind: "flag" | "limit"
                value: number | null
            }>
            offers: Array<{
                id: string
                name: string
                durationValue: number
                durationUnit: "month" | "year"
                price: string
                currency: string
                discounts: Array<{
                    name: string
                    type: "percentage" | "fixed"
                    value: string
                    code: string | null
                }>
            }>
        }
    >
> {
    const plans = await getPrisma().plan.findMany({
        where: { type, status: "active" },
        orderBy: [{ catalogRole: "desc" }, { name: "asc" }],
        include: {
            permissions: {
                include: { permission: true },
                orderBy: { permission: { name: "asc" } },
            },
            offers: {
                where: { status: "active" },
                orderBy: [{ durationUnit: "asc" }, { durationValue: "asc" }, { price: "asc" }],
                include: {
                    discounts: {
                        include: { discount: true },
                    },
                },
            },
        },
    })

    return plans.map((plan) => ({
        ...plan,
        permissions: plan.permissions
            .filter((row) => row.permission.status === "active")
            .map((row) => ({
                code: row.permission.code,
                name: row.permission.name,
                valueKind: row.permission.valueKind,
                value: row.value,
            })),
        offers: plan.offers.map((offer) => ({
            id: offer.id,
            name: offer.name,
            durationValue: offer.durationValue,
            durationUnit: offer.durationUnit,
            price: offer.price.toString(),
            currency: offer.currency,
            discounts: offer.discounts
                .filter((row) => row.discount.status === "active")
                .map((row) => ({
                    name: row.discount.name,
                    type: row.discount.type,
                    value: row.discount.value.toString(),
                    code: row.discount.code,
                })),
        })),
    }))
}

export async function planCreate(input: PlanCreateInput): Promise<CatalogMutationResult<Plan>> {
    try {
        const plan = await getPrisma().$transaction(async (tx) => {
            const created = await tx.plan.create({
                data: {
                    name: input.name,
                    description: input.description?.trim() ? input.description.trim() : null,
                    type: input.type,
                    catalogRole: input.catalogRole,
                    status: input.status,
                },
            })
            await clearOtherCatalogRoles(tx, created.id, created.type, created.catalogRole)
            await replacePlanPermissions(tx, created.id, created.type, input.permissions)
            return created
        })
        return { ok: true, data: plan }
    } catch (e) {
        console.error("[planCreate]", e)
        return { ok: false, error: "Error al crear el plan" }
    }
}

export async function planUpdate(input: PlanUpdateInput): Promise<CatalogMutationResult<Plan>> {
    try {
        const current = await getPrisma().plan.findUnique({ where: { id: input.id } })
        if (!current) return { ok: false, error: "Plan no encontrado" }

        const plan = await getPrisma().$transaction(async (tx) => {
            const leaveError = await assertCanLeaveFreeRole(
                tx,
                current,
                input.catalogRole,
                input.status,
            )
            if (leaveError) throw new Error(leaveError)

            const updated = await tx.plan.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    description: input.description?.trim() ? input.description.trim() : null,
                    type: input.type,
                    catalogRole: input.catalogRole,
                    status: input.status,
                },
            })
            await clearOtherCatalogRoles(tx, updated.id, updated.type, updated.catalogRole)
            await replacePlanPermissions(tx, updated.id, updated.type, input.permissions)
            return updated
        })
        return { ok: true, data: plan }
    } catch (e) {
        console.error("[planUpdate]", e)
        const message = e instanceof Error ? e.message : "Error al actualizar el plan"
        if (message.includes("Free")) return { ok: false, error: message }
        return { ok: false, error: "Error al actualizar el plan" }
    }
}

export async function planUpdateStatus(
    input: PlanStatusUpdateInput,
): Promise<CatalogMutationResult<Plan>> {
    try {
        const current = await getPrisma().plan.findUnique({ where: { id: input.id } })
        if (!current) return { ok: false, error: "Plan no encontrado" }

        const plan = await getPrisma().$transaction(async (tx) => {
            const leaveError = await assertCanLeaveFreeRole(
                tx,
                current,
                current.catalogRole,
                input.status,
            )
            if (leaveError) throw new Error(leaveError)

            return tx.plan.update({
                where: { id: input.id },
                data: { status: input.status },
            })
        })
        return { ok: true, data: plan }
    } catch (e) {
        console.error("[planUpdateStatus]", e)
        const message = e instanceof Error ? e.message : "Error al cambiar el estado del plan"
        if (message.includes("Free")) return { ok: false, error: message }
        return { ok: false, error: "Error al cambiar el estado del plan" }
    }
}
