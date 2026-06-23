import type { Prisma, Role } from "@prisma/client"

type UserRef = { id: string; role: Role }

export function isStaffRole(role: Role): boolean {
    return role === "admin" || role === "superadmin"
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

export function assignableRolesForActor(actorRole: Role): Role[] {
    if (actorRole === "superadmin") return ["coach", "admin", "superadmin"]
    return ["coach"]
}

export function formatUserRole(role: Role): string {
    switch (role) {
        case "superadmin":
            return "Superadministrador"
        case "admin":
            return "Administrador"
        case "coach":
            return "Entrenador"
    }
}

export function filterableRolesForActor(actorRole: Role): Role[] {
    if (actorRole === "superadmin") return ["coach", "admin", "superadmin"]
    return ["coach", "admin"]
}
