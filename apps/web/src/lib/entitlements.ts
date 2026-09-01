import type { PlanType, Role } from "@prisma/client"

import { getGraceEndsAt, isInGracePeriod } from "@/lib/billing-config"
import { isStaffRole } from "@/lib/user-permissions"
import { getPrisma } from "@/lib/prisma"
import {
    buildEntitlementsFromPlanPermissions,
    buildEntitlementsFromSnapshot,
    expireOverdueSubscriptionsForUser,
    getActiveSubscription,
    type EntitlementEntry,
    type EntitlementsMap,
    type PermissionSnapshotItem,
} from "@/services/subscriptions.service"

export type { EntitlementEntry, EntitlementsMap, PermissionSnapshotItem }

export type BillingSubject = {
    titularUserId: string
    planType: PlanType
    actorUserId: string
    actorRole: Role
    clubId: string | null
    isClubMemberCoach: boolean
    canManageBilling: boolean
}

export async function resolveBillingSubject(userId: string): Promise<BillingSubject | null> {
    const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            clubId: true,
            clubAccessEnabled: true,
            managedClub: { select: { id: true } },
        },
    })
    if (!user) return null

    if (user.role === "club_manager" && user.managedClub) {
        return {
            titularUserId: user.id,
            planType: "club",
            actorUserId: user.id,
            actorRole: user.role,
            clubId: user.managedClub.id,
            isClubMemberCoach: false,
            canManageBilling: true,
        }
    }

    if (user.role === "coach" && user.clubId) {
        const club = await getPrisma().club.findUnique({
            where: { id: user.clubId },
            select: { id: true, managerId: true },
        })
        if (!club) return null
        return {
            titularUserId: club.managerId,
            planType: "club",
            actorUserId: user.id,
            actorRole: user.role,
            clubId: club.id,
            isClubMemberCoach: true,
            canManageBilling: false,
        }
    }

    return {
        titularUserId: user.id,
        planType: "individual",
        actorUserId: user.id,
        actorRole: user.role,
        clubId: null,
        isClubMemberCoach: false,
        canManageBilling: user.role === "coach",
    }
}

export async function getEffectiveEntitlements(userId: string): Promise<{
    entitlements: EntitlementsMap
    subject: BillingSubject | null
    planId: string | null
    planName: string | null
    catalogRole: "none" | "free" | "full" | null
    bypass: boolean
    inGracePeriod: boolean
    subscriptionEndDate: Date | null
    graceEndsAt: Date | null
}> {
    const emptyGrace = {
        inGracePeriod: false,
        subscriptionEndDate: null as Date | null,
        graceEndsAt: null as Date | null,
    }

    const subject = await resolveBillingSubject(userId)
    if (!subject) {
        return {
            entitlements: {},
            subject: null,
            planId: null,
            planName: null,
            catalogRole: null,
            bypass: false,
            ...emptyGrace,
        }
    }

    if (isStaffRole(subject.actorRole)) {
        return {
            entitlements: {},
            subject,
            planId: null,
            planName: null,
            catalogRole: null,
            bypass: true,
            ...emptyGrace,
        }
    }

    await expireOverdueSubscriptionsForUser(subject.titularUserId)
    const active = await getActiveSubscription(subject.titularUserId)

    if (active) {
        const ents = buildEntitlementsFromSnapshot(
            active.permissionsSnapshot as PermissionSnapshotItem[],
        )
        const inGrace = isInGracePeriod(active.endDate)
        return {
            entitlements: ents,
            subject,
            planId: active.planId,
            planName: active.planName,
            catalogRole: active.plan.catalogRole,
            bypass: false,
            inGracePeriod: inGrace,
            subscriptionEndDate: active.endDate,
            graceEndsAt: inGrace ? getGraceEndsAt(active.endDate) : null,
        }
    }

    const freePlan = await getPrisma().plan.findFirst({
        where: {
            type: subject.planType,
            catalogRole: "free",
            status: "active",
        },
        include: {
            permissions: { include: { permission: true } },
        },
    })

    if (!freePlan) {
        return {
            entitlements: {},
            subject,
            planId: null,
            planName: null,
            catalogRole: null,
            bypass: false,
            ...emptyGrace,
        }
    }

    return {
        entitlements: buildEntitlementsFromPlanPermissions(freePlan.permissions),
        subject,
        planId: freePlan.id,
        planName: freePlan.name,
        catalogRole: "free",
        bypass: false,
        ...emptyGrace,
    }
}

export function hasFlag(ents: EntitlementsMap, code: string): boolean {
    return Boolean(ents[code]?.enabled)
}

export function getLimit(ents: EntitlementsMap, code: string): number | null | undefined {
    const entry = ents[code]
    if (!entry || !entry.enabled) return undefined
    return entry.limit
}

export function assertFlag(
    ents: EntitlementsMap,
    code: string,
    bypass: boolean,
    errorMessage: string,
): { ok: true } | { ok: false; error: string } {
    if (bypass || hasFlag(ents, code)) return { ok: true }
    return { ok: false, error: errorMessage }
}

export function assertWithinLimit(
    ents: EntitlementsMap,
    code: string,
    used: number,
    bypass: boolean,
    errorMessage: string,
): { ok: true } | { ok: false; error: string } {
    if (bypass) return { ok: true }
    const limit = getLimit(ents, code)
    // Sin permiso de límite en el plan = sin tope mensual.
    if (limit === undefined || limit === null) return { ok: true }
    if (used >= limit) return { ok: false, error: errorMessage }
    return { ok: true }
}

export function canShowUpgradeCta(subject: BillingSubject | null, catalogRole: string | null): boolean {
    if (!subject) return false
    if (!subject.canManageBilling) return false
    return catalogRole !== "full"
}
