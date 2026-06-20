import { auth } from "@/auth"
import { isStaffRole } from "@/lib/user-permissions"

import { AppHeaderClient } from "./AppHeaderClient"

export async function AppHeader() {
    const session = await auth()
    if (!session?.user) return null

    const { firstName, lastName, avatarUrl, role } = session.user

    return (
        <AppHeaderClient
            firstName={firstName}
            lastName={lastName}
            avatarUrl={avatarUrl}
            isAdmin={isStaffRole(role)}
        />
    )
}
