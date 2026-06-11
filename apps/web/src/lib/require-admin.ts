import { auth } from "@/auth"
import { isStaffRole } from "@/lib/user-permissions"
import type { AuthUser } from "@/types/auth-user"

export type AdminCheckResult =
    | { ok: true; user: AuthUser }
    | { ok: false; error: string }

export async function requireAdmin(): Promise<AdminCheckResult> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }
    if (!isStaffRole(session.user.role)) {
        return { ok: false, error: "No tienes permisos de administrador" }
    }
    return { ok: true, user: session.user }
}
