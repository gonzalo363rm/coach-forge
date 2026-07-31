import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getMyClubAction } from "@/app/actions/club"
import { auth } from "@/auth"
import { ClubMemberCreateForm } from "@/components/club/ClubMemberCreateForm"
import { createPageMetadata } from "@/lib/seo"
import { isClubManagerRole } from "@/lib/user-permissions"

export const metadata: Metadata = createPageMetadata({
    title: "Nuevo coach",
    description: "Creá un coach para tu club.",
    path: "/club/members/new",
    noIndex: true,
})

export default async function ClubMemberNewPage() {
    const session = await auth()
    if (!session?.user || !isClubManagerRole(session.user.role)) {
        redirect("/forbidden")
    }

    const result = await getMyClubAction()
    if (!result.ok) {
        redirect("/forbidden")
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <ClubMemberCreateForm
                    clubName={result.data.name}
                    memberCount={result.data.memberCount}
                    maxMembers={result.data.maxMembers}
                />
            </div>
        </div>
    )
}
