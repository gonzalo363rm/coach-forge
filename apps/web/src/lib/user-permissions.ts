import type { ContentVisibility, Prisma, Role } from "@prisma/client"

type UserRef = { id: string; role: Role; clubId?: string | null }

export function isStaffRole(role: Role): boolean {
    return role === "admin" || role === "superadmin"
}

export function isSuperadminRole(role: Role): boolean {
    return role === "superadmin"
}

export function isClubManagerRole(role: Role): boolean {
    return role === "club_manager"
}

/** Coaches (incl. miembros de club), managers y staff pueden ver /plans. */
export function canViewPlansNav(role: Role): boolean {
    return role === "coach" || role === "club_manager" || isStaffRole(role)
}

export function canManageOwnedResource(
    actor: { id: string; role: Role },
    creatorId: string | null | undefined,
): boolean {
    if (isStaffRole(actor.role)) return true
    if (!creatorId) return false
    return creatorId === actor.id
}

export function canManageUserRoles(actorRole: Role): boolean {
    return actorRole === "superadmin"
}

export function userListVisibilityFilter(actorRole: Role): Prisma.UserWhereInput | undefined {
    if (actorRole === "admin") {
        return { role: { not: "superadmin" } }
    }
    return undefined
}

export function canAdminViewUser(
    actorRole: Role,
    actorId: string,
    target: UserRef,
): boolean {
    if (actorRole === "superadmin") return true
    if (actorRole === "admin") {
        if (target.role === "superadmin") return false
        if (target.role === "admin" && target.id !== actorId) return false
        return true
    }
    return false
}

export function canAdminEditUser(
    actorRole: Role,
    actorId: string,
    target: UserRef,
): boolean {
    return canAdminViewUser(actorRole, actorId, target)
}

export function canAdminDeleteUser(
    actorRole: Role,
    actorId: string,
    target: UserRef,
): boolean {
    if (target.id === actorId) return false
    if (actorRole === "superadmin") return true
    if (actorRole === "admin") return target.role === "coach"
    return false
}

export function canClubManagerViewMember(
    managerClubId: string,
    target: UserRef,
): boolean {
    return target.role === "coach" && target.clubId === managerClubId
}

export function canClubManagerManageMember(
    managerClubId: string,
    target: UserRef,
): boolean {
    return canClubManagerViewMember(managerClubId, target)
}

export function assignableRolesForActor(actorRole: Role): Role[] {
    if (actorRole === "superadmin") {
        return ["coach", "admin", "superadmin", "club_manager"]
    }
    return ["coach"]
}

export function formatUserRole(role: Role): string {
    switch (role) {
        case "superadmin":
            return "Superadministrador"
        case "admin":
            return "Administrador"
        case "club_manager":
            return "Manager de club"
        case "coach":
            return "Entrenador"
    }
}

export function filterableRolesForActor(actorRole: Role): Role[] {
    if (actorRole === "superadmin") {
        return ["coach", "admin", "superadmin", "club_manager"]
    }
    return ["coach", "admin", "club_manager"]
}

export function canViewContent(
    actor: { id: string; role: Role; clubId?: string | null; managedClubId?: string | null } | null,
    content: { visibility: ContentVisibility; creatorId: string | null },
    creatorClubId?: string | null,
): boolean {
    if (content.visibility === "public") return true
    if (!actor) return false
    if (isStaffRole(actor.role)) return true
    if (content.creatorId === actor.id) return true
    const actorClubId =
        actor.role === "club_manager" ? (actor.managedClubId ?? null) : (actor.clubId ?? null)
    if (
        content.visibility === "club" &&
        actorClubId &&
        creatorClubId &&
        actorClubId === creatorClubId
    ) {
        return true
    }
    return false
}

export function canUseContentAsTemplate(
    actor: { id: string; role: Role; clubId?: string | null; managedClubId?: string | null },
    content: { visibility: ContentVisibility; creatorId: string | null },
    creatorClubId?: string | null,
): boolean {
    if (canManageOwnedResource(actor, content.creatorId)) return true
    return canViewContent(actor, content, creatorClubId)
}
