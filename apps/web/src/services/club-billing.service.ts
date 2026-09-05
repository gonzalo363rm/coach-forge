import { getEffectiveEntitlements, getLimit } from "@/lib/entitlements"
import { getPrisma } from "@/lib/prisma"

export type ClubBillingMutationResult =
    | { ok: true }
    | { ok: false; error: string }

/**
 * Applies clubAccessEnabled to coaches: enable the oldest `limit` members,
 * disable the rest. null limit = unlimited (all enabled).
 */
export async function applyMemberQuotaForClub(clubId: string): Promise<ClubBillingMutationResult> {
    const club = await getPrisma().club.findUnique({
        where: { id: clubId },
        select: { id: true, managerId: true, maxMembers: true },
    })
    if (!club) return { ok: false, error: "Club no encontrado" }

    const { entitlements, bypass } = await getEffectiveEntitlements(club.managerId)
    let limit: number | null
    if (bypass) {
        limit = null
    } else {
        const fromPlan = getLimit(entitlements, "max_club_members")
        if (fromPlan === undefined) {
            limit = 0
        } else {
            limit = fromPlan
        }
    }

    const members = await getPrisma().user.findMany({
        where: { clubId, role: "coach", deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    })

    if (limit === null) {
        await getPrisma().user.updateMany({
            where: { clubId, role: "coach", deletedAt: null },
            data: { clubAccessEnabled: true },
        })
        return { ok: true }
    }

    const enableIds = members.slice(0, limit).map((m) => m.id)
    const disableIds = members.slice(limit).map((m) => m.id)

    await getPrisma().$transaction([
        ...(enableIds.length > 0
            ? [
                  getPrisma().user.updateMany({
                      where: { id: { in: enableIds } },
                      data: { clubAccessEnabled: true },
                  }),
              ]
            : []),
        ...(disableIds.length > 0
            ? [
                  getPrisma().user.updateMany({
                      where: { id: { in: disableIds } },
                      data: { clubAccessEnabled: false },
                  }),
              ]
            : []),
    ])

    return { ok: true }
}

export async function syncClubMaxMembersFromEntitlements(
    managerUserId: string,
): Promise<ClubBillingMutationResult> {
    const club = await getPrisma().club.findUnique({
        where: { managerId: managerUserId },
        select: { id: true },
    })
    if (!club) return { ok: true }

    const { entitlements, bypass } = await getEffectiveEntitlements(managerUserId)
    let maxMembers: number
    if (bypass) {
        maxMembers = 10_000
    } else {
        const limit = getLimit(entitlements, "max_club_members")
        if (limit === undefined) maxMembers = 0
        else if (limit === null) maxMembers = 10_000
        else maxMembers = limit
    }

    await getPrisma().club.update({
        where: { id: club.id },
        data: { maxMembers },
    })

    await applyMemberQuotaForClub(club.id)
    return { ok: true }
}

export async function setClubMemberAccess(input: {
    clubId: string
    managerId: string
    memberId: string
    clubAccessEnabled: boolean
}): Promise<ClubBillingMutationResult> {
    const member = await getPrisma().user.findFirst({
        where: {
            id: input.memberId,
            clubId: input.clubId,
            role: "coach",
        },
    })
    if (!member) return { ok: false, error: "Miembro no encontrado" }

    if (input.clubAccessEnabled) {
        const club = await getPrisma().club.findUnique({ where: { id: input.clubId } })
        if (!club) return { ok: false, error: "Club no encontrado" }

        const enabledCount = await getPrisma().user.count({
            where: {
                clubId: input.clubId,
                role: "coach",
                clubAccessEnabled: true,
                id: { not: input.memberId },
            },
        })
        if (enabledCount >= club.maxMembers) {
            return {
                ok: false,
                error: `Cupo de miembros habilitados alcanzado (${club.maxMembers}). Deshabilitá otro coach antes.`,
            }
        }
    }

    await getPrisma().user.update({
        where: { id: input.memberId },
        data: { clubAccessEnabled: input.clubAccessEnabled },
    })
    return { ok: true }
}
