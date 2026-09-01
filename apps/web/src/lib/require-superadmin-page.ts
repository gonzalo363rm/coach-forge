import { auth } from "@/auth"
import { redirect } from "next/navigation"

import { isSuperadminRole } from "@/lib/user-permissions"

export async function requireSuperadminPage() {
    const session = await auth()
    if (!session?.user || !isSuperadminRole(session.user.role)) {
        redirect("/forbidden")
    }
    return session.user
}
