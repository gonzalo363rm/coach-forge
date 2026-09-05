import type { ContentVisibility } from "@prisma/client"

import {
    assertFlag,
    assertWithinLimit,
    getEffectiveEntitlements,
} from "@/lib/entitlements"
import { getPrisma } from "@/lib/prisma"

export type EnforceResult = { ok: true } | { ok: false; error: string }

async function assertActorMayUseApp(userId: string): Promise<EnforceResult> {
    const user = await getPrisma().user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { role: true, clubId: true, clubAccessEnabled: true },
    })
    if (!user) return { ok: false, error: "Usuario no encontrado" }
    if (user.role === "coach" && user.clubId && !user.clubAccessEnabled) {
        return {
            ok: false,
            error: "Tu acceso al club está deshabilitado. Pedile al manager que te habilite.",
        }
    }
    return { ok: true }
}

function monthBounds(now = new Date()): { from: Date; to: Date } {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    return { from, to }
}

export async function countMonthlyCreations(
    userId: string,
    kind: "exercise" | "class",
): Promise<number> {
    const { entitlements, subject, bypass } = await getEffectiveEntitlements(userId)
    if (bypass) return 0
    if (!subject) return 0

    const { from, to } = monthBounds()
    let creatorIds: string[] = [subject.titularUserId]

    if (subject.planType === "club" && subject.clubId) {
        const members = await getPrisma().user.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { clubId: subject.clubId, role: "coach" },
                    { id: subject.titularUserId },
                ],
            },
            select: { id: true },
        })
        creatorIds = members.map((m) => m.id)
    }

    if (kind === "exercise") {
        return getPrisma().exercise.count({
            where: {
                creatorId: { in: creatorIds },
                createdAt: { gte: from, lt: to },
            },
        })
    }

    return getPrisma().trainingClass.count({
        where: {
            creatorId: { in: creatorIds },
            createdAt: { gte: from, lt: to },
        },
    })
}

export async function enforceCreateExercise(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access

    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    const flag = assertFlag(
        entitlements,
        "create_exercise",
        bypass,
        "Tu plan no permite crear ejercicios",
    )
    if (!flag.ok) return flag

    const used = await countMonthlyCreations(userId, "exercise")
    return assertWithinLimit(
        entitlements,
        "max_exercises_per_month",
        used,
        bypass,
        `Alcanzaste el límite mensual de ejercicios (${used})`,
    )
}

export async function enforceEditExercise(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access
    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    return assertFlag(
        entitlements,
        "edit_exercise",
        bypass,
        "Tu plan no permite editar ejercicios",
    )
}

export async function enforceDeleteExercise(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access
    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    return assertFlag(
        entitlements,
        "delete_exercise",
        bypass,
        "Tu plan no permite eliminar ejercicios",
    )
}

export async function enforceCreateClass(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access

    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    const flag = assertFlag(
        entitlements,
        "create_class",
        bypass,
        "Tu plan no permite crear clases",
    )
    if (!flag.ok) return flag

    const used = await countMonthlyCreations(userId, "class")
    return assertWithinLimit(
        entitlements,
        "max_classes_per_month",
        used,
        bypass,
        `Alcanzaste el límite mensual de clases (${used})`,
    )
}

export async function enforceEditClass(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access
    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    return assertFlag(entitlements, "edit_class", bypass, "Tu plan no permite editar clases")
}

export async function enforceDeleteClass(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access
    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    return assertFlag(
        entitlements,
        "delete_class",
        bypass,
        "Tu plan no permite eliminar clases",
    )
}

export async function enforceStartClass(userId: string): Promise<EnforceResult> {
    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access
    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    return assertFlag(
        entitlements,
        "start_class",
        bypass,
        "Tu plan no permite iniciar clases",
    )
}

export async function enforceContentVisibility(
    userId: string,
    visibility: ContentVisibility,
): Promise<EnforceResult> {
    if (visibility === "private") return { ok: true }

    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access

    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    if (visibility === "public") {
        return assertFlag(
            entitlements,
            "access_public_exercise",
            bypass,
            "Tu plan no permite contenido público",
        )
    }
    return assertFlag(
        entitlements,
        "access_club_exercise",
        bypass,
        "Tu plan no permite contenido de club",
    )
}

export async function enforceClassVisibility(
    userId: string,
    visibility: ContentVisibility,
): Promise<EnforceResult> {
    if (visibility === "private") return { ok: true }

    const access = await assertActorMayUseApp(userId)
    if (!access.ok) return access

    const { entitlements, bypass } = await getEffectiveEntitlements(userId)
    if (visibility === "public") {
        return assertFlag(
            entitlements,
            "access_public_class",
            bypass,
            "Tu plan no permite clases públicas",
        )
    }
    return assertFlag(
        entitlements,
        "access_club_class",
        bypass,
        "Tu plan no permite clases de club",
    )
}
