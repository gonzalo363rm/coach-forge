import { auth } from "@/auth"
import { isClubManagerRole } from "@/lib/user-permissions"
import type { AuthUser } from "@/types/auth-user"
import { clubEnsureForManager } from "@/services/clubs.service"

export type ClubManagerCheckResult =
    | { ok: true; user: AuthUser; clubId: string }
    | { ok: false; error: string }

export async function requireClubManager(): Promise<ClubManagerCheckResult> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }
    if (!isClubManagerRole(session.user.role)) {
        return { ok: false, error: "No tienes permisos de manager de club" }
    }

    try {
        const club = await clubEnsureForManager({
            id: session.user.id,
            firstName: session.user.firstName,
        })
        return { ok: true, user: session.user, clubId: club.id }
    } catch (e) {
        console.error("[requireClubManager]", e)
        return { ok: false, error: "No se encontró el club asociado" }
    }
}
