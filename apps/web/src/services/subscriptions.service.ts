import type {
    DurationUnit,
    Plan,
    PlanType,
    Prisma,
    Subscription,
} from "@prisma/client"

import { getGraceCutoffDate, getGraceEndsAt, isInGracePeriod } from "@/lib/billing-config"
import { getPrisma } from "@/lib/prisma"
import { applyDiscounts, isCatalogWindowValid } from "@/lib/plan-pricing"

export type EntitlementEntry = {
    enabled: boolean
    /** null = unlimited; undefined on missing code = not included */
    limit: number | null
}

export type EntitlementsMap = Record<string, EntitlementEntry>

export type PermissionSnapshotItem = {
    code: string
    valueKind: "flag" | "limit"
    value: number | null
}

export type CatalogMutationResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string }

export function buildEntitlementsFromSnapshot(
    snapshot: PermissionSnapshotItem[] | null | undefined,
): EntitlementsMap {
    const map: EntitlementsMap = {}
    if (!Array.isArray(snapshot)) return map
    for (const item of snapshot) {
        if (!item?.code) continue
        if (item.valueKind === "flag") {
            map[item.code] = { enabled: true, limit: null }
        } else {
            map[item.code] = { enabled: true, limit: item.value }
        }
    }
    return map
}

export function buildEntitlementsFromPlanPermissions(
    rows: Array<{
        value: number | null
        permission: { code: string; valueKind: "flag" | "limit"; status: string }
    }>,
): EntitlementsMap {
    const map: EntitlementsMap = {}
    for (const row of rows) {
        if (row.permission.status !== "active") continue
        if (row.permission.valueKind === "flag") {
            map[row.permission.code] = { enabled: true, limit: null }
        } else {
            map[row.permission.code] = { enabled: true, limit: row.value }
        }
    }
    return map
}

export async function buildPermissionSnapshotForPlan(
    planId: string,
): Promise<PermissionSnapshotItem[]> {
    const rows = await getPrisma().planPermission.findMany({
        where: { planId },
        include: { permission: true },
    })
    return rows
        .filter((row) => row.permission.status === "active")
        .map((row) => ({
            code: row.permission.code,
            valueKind: row.permission.valueKind,
            value: row.permission.valueKind === "flag" ? null : row.value,
        }))
}

export function addDuration(from: Date, value: number, unit: DurationUnit): Date {
    const end = new Date(from)
    if (unit === "year") {
        end.setFullYear(end.getFullYear() + value)
    } else {
        end.setMonth(end.getMonth() + value)
    }
    return end
}

export async function getActiveSubscription(
    userId: string,
): Promise<(Subscription & { plan: Plan }) | null> {
    const now = new Date()
    const graceCutoff = getGraceCutoffDate(now)
    return getPrisma().subscription.findFirst({
        where: {
            userId,
            status: "active",
            startDate: { lte: now },
            endDate: { gt: graceCutoff },
        },
        include: { plan: true },
        orderBy: { endDate: "desc" },
    })
}

export async function expireOverdueSubscriptionsForUser(userId: string): Promise<number> {
    const graceCutoff = getGraceCutoffDate()
    const result = await getPrisma().subscription.updateMany({
        where: {
            userId,
            status: "active",
            endDate: { lte: graceCutoff },
        },
        data: { status: "expired" },
    })
    return result.count
}

export async function expireOverdueSubscriptions(): Promise<number> {
    const graceCutoff = getGraceCutoffDate()
    const result = await getPrisma().subscription.updateMany({
        where: {
            status: "active",
            endDate: { lte: graceCutoff },
        },
        data: { status: "expired" },
    })
    return result.count
}

export async function createPendingSubscription(input: {
    userId: string
    planOfferId: string
    discountCode?: string | null
}): Promise<
    CatalogMutationResult<{
        subscriptionId: string
        paymentId: string
        amount: number
        currency: string
        planName: string
        offerName: string
    }>
> {
    const offer = await getPrisma().planOffer.findUnique({
        where: { id: input.planOfferId },
        include: {
            plan: true,
            discounts: { include: { discount: true } },
        },
    })
    if (!offer || offer.status !== "active" || offer.plan.status !== "active") {
        return { ok: false, error: "Oferta no disponible" }
    }
    if (!isCatalogWindowValid(offer)) {
        return { ok: false, error: "La oferta no está vigente" }
    }

    const user = await getPrisma().user.findUnique({ where: { id: input.userId } })
    if (!user) return { ok: false, error: "Usuario no encontrado" }

    const expectedType: PlanType = user.role === "club_manager" ? "club" : "individual"
    if (offer.plan.type !== expectedType) {
        return { ok: false, error: "Esta oferta no corresponde a tu tipo de cuenta" }
    }

    const code = input.discountCode?.trim().toUpperCase() || ""
    const associated = offer.discounts.map((row) => row.discount)
    const associatedValid = associated.filter((d) => isCatalogWindowValid(d))
    const coupon = code
        ? associatedValid.find((d) => d.code === code)
        : null
    if (code && !coupon) {
        return { ok: false, error: "Cupón inválido o no asociado a esta oferta" }
    }

    // Todos los descuentos asociados vigentes se aplican al precio de catálogo.
    const discountsForPrice = associatedValid.map((d) => ({
        type: d.type,
        value: Number(d.value.toString()),
    }))

    const originalPrice = Number(offer.price.toString())
    const breakdown = applyDiscounts(originalPrice, discountsForPrice)
    const snapshot = await buildPermissionSnapshotForPlan(offer.planId)
    const startDate = new Date()
    const endDate = addDuration(startDate, offer.durationValue, offer.durationUnit)

    try {
        const created = await getPrisma().$transaction(async (tx) => {
            const subscription = await tx.subscription.create({
                data: {
                    userId: input.userId,
                    planId: offer.planId,
                    planOfferId: offer.id,
                    discountId: coupon?.id ?? null,
                    planName: offer.plan.name,
                    offerName: offer.name,
                    durationValue: offer.durationValue,
                    durationUnit: offer.durationUnit,
                    originalPrice: breakdown.originalPrice,
                    discountAmount: breakdown.discountAmount,
                    finalPrice: breakdown.finalPrice,
                    currency: offer.currency,
                    permissionsSnapshot: snapshot as unknown as Prisma.InputJsonValue,
                    startDate,
                    endDate,
                    status: "pending",
                },
            })
            const payment = await tx.payment.create({
                data: {
                    subscriptionId: subscription.id,
                    amount: breakdown.finalPrice,
                    currency: offer.currency,
                    provider: "mercado_pago",
                    status: "pending",
                },
            })
            return { subscription, payment }
        })

        return {
            ok: true,
            data: {
                subscriptionId: created.subscription.id,
                paymentId: created.payment.id,
                amount: breakdown.finalPrice,
                currency: offer.currency,
                planName: offer.plan.name,
                offerName: offer.name,
            },
        }
    } catch (e) {
        console.error("[createPendingSubscription]", e)
        return { ok: false, error: "No se pudo iniciar la suscripción" }
    }
}

export async function activateSubscriptionAfterPayment(input: {
    subscriptionId: string
    paymentId: string
    externalId?: string | null
    merchantOrderId?: string | null
    providerStatus?: string | null
    providerPayload?: unknown
    paymentMethod?:
        | "credit_card"
        | "debit_card"
        | "account_money"
        | "ticket"
        | "bank_transfer"
        | "other"
        | null
}): Promise<CatalogMutationResult<Subscription>> {
    try {
        const result = await getPrisma().$transaction(async (tx) => {
            const subscription = await tx.subscription.findUnique({
                where: { id: input.subscriptionId },
                include: { plan: true, user: true },
            })
            if (!subscription) throw new Error("Suscripción no encontrada")

            const now = new Date()
            const startDate = now
            const endDate = addDuration(
                startDate,
                subscription.durationValue,
                subscription.durationUnit,
            )

            await tx.subscription.updateMany({
                where: {
                    userId: subscription.userId,
                    status: "active",
                    id: { not: subscription.id },
                },
                data: { status: "cancelled" },
            })

            const updated = await tx.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: "active",
                    startDate,
                    endDate,
                },
            })

            await tx.payment.update({
                where: { id: input.paymentId },
                data: {
                    status: "completed",
                    paidAt: now,
                    externalId: input.externalId ?? undefined,
                    merchantOrderId: input.merchantOrderId ?? undefined,
                    providerStatus: input.providerStatus ?? undefined,
                    paymentMethod: input.paymentMethod ?? undefined,
                    providerPayload: input.providerPayload
                        ? (input.providerPayload as Prisma.InputJsonValue)
                        : undefined,
                },
            })

            return { updated, user: subscription.user, planType: subscription.plan.type }
        })

        const { syncClubMaxMembersFromEntitlements } = await import(
            "@/services/club-billing.service"
        )
        if (result.planType === "club") {
            await syncClubMaxMembersFromEntitlements(result.user.id)
        }

        return { ok: true, data: result.updated }
    } catch (e) {
        console.error("[activateSubscriptionAfterPayment]", e)
        const message = e instanceof Error ? e.message : "No se pudo activar la suscripción"
        return { ok: false, error: message }
    }
}

function parseEndOfLocalDay(isoDate: string): Date {
    const [year, month, day] = isoDate.split("-").map((part) => Number(part))
    if (!year || !month || !day) {
        throw new Error("Fecha inválida")
    }
    return new Date(year, month - 1, day, 23, 59, 59, 999)
}

/**
 * Asignación manual de plan por superadmin (sin Mercado Pago).
 * Solo para titulares de billing (manager / coach individual).
 */
export async function assignPlanBySuperadmin(input: {
    userId: string
    planId: string
    endDate?: string | null
}): Promise<
    CatalogMutationResult<{
        planId: string
        planName: string
        endDate: Date | null
        mode: "free" | "subscription"
    }>
> {
    const user = await getPrisma().user.findUnique({
        where: { id: input.userId },
        select: {
            id: true,
            role: true,
            clubId: true,
            managedClub: { select: { id: true } },
        },
    })
    if (!user) return { ok: false, error: "Usuario no encontrado" }

    if (user.role === "coach" && user.clubId) {
        return {
            ok: false,
            error: "Los coaches miembros de un club heredan el plan del manager",
        }
    }

    if (user.role !== "coach" && user.role !== "club_manager") {
        return { ok: false, error: "Este rol no usa planes de suscripción" }
    }

    const expectedType: PlanType = user.role === "club_manager" ? "club" : "individual"
    if (user.role === "club_manager" && !user.managedClub) {
        return { ok: false, error: "El manager no tiene club asignado" }
    }

    const plan = await getPrisma().plan.findUnique({
        where: { id: input.planId },
    })
    if (!plan || plan.status !== "active") {
        return { ok: false, error: "Plan no disponible" }
    }
    if (plan.type !== expectedType) {
        return {
            ok: false,
            error:
                expectedType === "club"
                    ? "Este usuario necesita un plan de tipo Club"
                    : "Este usuario necesita un plan de tipo Individual",
        }
    }

    const isFree = plan.catalogRole === "free"
    const endDateRaw = input.endDate?.trim() || ""

    if (!isFree && !endDateRaw) {
        return { ok: false, error: "Indicá la fecha de vencimiento" }
    }

    try {
        if (isFree) {
            await getPrisma().subscription.updateMany({
                where: {
                    userId: user.id,
                    status: { in: ["active", "pending"] },
                },
                data: { status: "cancelled" },
            })

            if (expectedType === "club") {
                const { syncClubMaxMembersFromEntitlements } = await import(
                    "@/services/club-billing.service"
                )
                await syncClubMaxMembersFromEntitlements(user.id)
            }

            return {
                ok: true,
                data: {
                    planId: plan.id,
                    planName: plan.name,
                    endDate: null,
                    mode: "free",
                },
            }
        }

        const endDate = parseEndOfLocalDay(endDateRaw)
        const now = new Date()
        if (endDate.getTime() <= now.getTime()) {
            return { ok: false, error: "La fecha de vencimiento debe ser posterior a hoy" }
        }

        const snapshot = await buildPermissionSnapshotForPlan(plan.id)
        const ms = endDate.getTime() - now.getTime()
        const durationValue = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24 * 30)))

        await getPrisma().$transaction(async (tx) => {
            await tx.subscription.updateMany({
                where: {
                    userId: user.id,
                    status: { in: ["active", "pending"] },
                },
                data: { status: "cancelled" },
            })

            await tx.subscription.create({
                data: {
                    userId: user.id,
                    planId: plan.id,
                    planOfferId: null,
                    discountId: null,
                    planName: plan.name,
                    offerName: "Asignación manual",
                    durationValue,
                    durationUnit: "month",
                    originalPrice: 0,
                    discountAmount: 0,
                    finalPrice: 0,
                    currency: "ARS",
                    permissionsSnapshot: snapshot as unknown as Prisma.InputJsonValue,
                    startDate: now,
                    endDate,
                    status: "active",
                },
            })
        })

        if (expectedType === "club") {
            const { syncClubMaxMembersFromEntitlements } = await import(
                "@/services/club-billing.service"
            )
            await syncClubMaxMembersFromEntitlements(user.id)
        }

        return {
            ok: true,
            data: {
                planId: plan.id,
                planName: plan.name,
                endDate,
                mode: "subscription",
            },
        }
    } catch (e) {
        console.error("[assignPlanBySuperadmin]", e)
        return { ok: false, error: "No se pudo asignar el plan" }
    }
}

export type UserBillingAdminSummary = {
    canEdit: boolean
    reason?: string
    planType: PlanType | null
    currentPlanId: string | null
    currentPlanName: string | null
    catalogRole: "none" | "free" | "full" | null
    endDate: Date | null
    graceEndsAt: Date | null
    subscriptionStatus: Subscription["status"] | null
}

export async function getUserBillingAdminSummary(
    userId: string,
): Promise<UserBillingAdminSummary> {
    const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            clubId: true,
            managedClub: { select: { id: true } },
        },
    })

    if (!user) {
        return {
            canEdit: false,
            reason: "Usuario no encontrado",
            planType: null,
            currentPlanId: null,
            currentPlanName: null,
            catalogRole: null,
            endDate: null,
            graceEndsAt: null,
            subscriptionStatus: null,
        }
    }

    if (user.role === "coach" && user.clubId) {
        return {
            canEdit: false,
            reason: "Este coach es miembro de un club: el plan lo gestiona el manager.",
            planType: "club",
            currentPlanId: null,
            currentPlanName: null,
            catalogRole: null,
            endDate: null,
            graceEndsAt: null,
            subscriptionStatus: null,
        }
    }

    if (user.role !== "coach" && user.role !== "club_manager") {
        return {
            canEdit: false,
            reason: "Los roles de staff no usan planes de suscripción.",
            planType: null,
            currentPlanId: null,
            currentPlanName: null,
            catalogRole: null,
            endDate: null,
            graceEndsAt: null,
            subscriptionStatus: null,
        }
    }

    const planType: PlanType = user.role === "club_manager" ? "club" : "individual"
    await expireOverdueSubscriptionsForUser(user.id)
    const active = await getActiveSubscription(user.id)

    if (active) {
        const inGrace = isInGracePeriod(active.endDate)
        return {
            canEdit: true,
            planType,
            currentPlanId: active.planId,
            currentPlanName: active.planName,
            catalogRole: active.plan.catalogRole,
            endDate: active.endDate,
            graceEndsAt: inGrace ? getGraceEndsAt(active.endDate) : null,
            subscriptionStatus: active.status,
        }
    }

    const freePlan = await getPrisma().plan.findFirst({
        where: { type: planType, catalogRole: "free", status: "active" },
        select: { id: true, name: true, catalogRole: true },
    })

    return {
        canEdit: true,
        planType,
        currentPlanId: freePlan?.id ?? null,
        currentPlanName: freePlan?.name ?? "Free (catálogo)",
        catalogRole: freePlan?.catalogRole ?? "free",
        endDate: null,
        graceEndsAt: null,
        subscriptionStatus: null,
    }
}
