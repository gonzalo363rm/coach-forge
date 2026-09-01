import { auth } from "@/auth"
import { isSuperadminRole } from "@/lib/user-permissions"
import type { AuthUser } from "@/types/auth-user"

export type SuperadminCheckResult =
    | { ok: true; user: AuthUser }
    | { ok: false; error: string }

export async function requireSuperadmin(): Promise<SuperadminCheckResult> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }
    if (!isSuperadminRole(session.user.role)) {
        return { ok: false, error: "No tienes permisos de superadministrador" }
    }
    return { ok: true, user: session.user }
}
