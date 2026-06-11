import { auth } from "@/auth"
import type { AuthUser } from "@/types/auth-user"

export type AdminCheckResult =
    | { ok: true; user: AuthUser }
    | { ok: false; error: string }

export async function requireAdmin(): Promise<AdminCheckResult> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }
    if (session.user.role !== "admin") {
        return { ok: false, error: "No tienes permisos de administrador" }
    }
    return { ok: true, user: session.user }
}
