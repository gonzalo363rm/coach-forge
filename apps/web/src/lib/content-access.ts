import type { ContentVisibility } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"

export type ActorWithClub = {
    id: string
    role: import("@prisma/client").Role
    clubId: string | null
    managedClubId: string | null
}

export async function getActorWithClub(userId: string): Promise<ActorWithClub | null> {
    const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            clubId: true,
            managedClub: { select: { id: true } },
        },
    })
    if (!user) return null
    return {
        id: user.id,
        role: user.role,
        clubId: user.clubId,
        managedClubId: user.managedClub?.id ?? null,
    }
}

export async function getCreatorClubId(creatorId: string | null): Promise<string | null> {
    if (!creatorId) return null
    const creator = await getPrisma().user.findUnique({
        where: { id: creatorId },
        select: { clubId: true },
    })
    return creator?.clubId ?? null
}

export function parseVisibilityFilter(raw: string): ContentVisibility | null {
    if (raw === "private" || raw === "club" || raw === "public") return raw
    return null
}
