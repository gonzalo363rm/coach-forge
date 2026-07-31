import { auth } from "@/auth"
import { isClubManagerRole, isStaffRole } from "@/lib/user-permissions"
import { userGetAvatarUrl } from "@/services/users.service"

import { AppHeaderClient } from "./AppHeaderClient"
import { AppHeaderGuest } from "./AppHeaderGuest"

export async function AppHeader() {
    const session = await auth()
    if (!session?.user) {
        return <AppHeaderGuest />
    }

    const { id, firstName, lastName, avatarUrl: sessionAvatarUrl, role } = session.user
    const avatarUrl = (await userGetAvatarUrl(id)) ?? sessionAvatarUrl

    return (
        <AppHeaderClient
            firstName={firstName}
            lastName={lastName}
            avatarUrl={avatarUrl}
            isAdmin={isStaffRole(role)}
            isClubManager={isClubManagerRole(role)}
        />
    )
}
