import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getClubMemberAction, getMyClubAction } from "@/app/actions/club"
import { auth } from "@/auth"
import { ClubMemberEditForm } from "@/components/club/ClubMemberEditForm"
import { createPageMetadata } from "@/lib/seo"
import { isClubManagerRole } from "@/lib/user-permissions"

export const metadata: Metadata = createPageMetadata({
    title: "Editar coach",
    description: "Editá un coach de tu club.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function ClubMemberEditPage({ params }: Props) {
    const session = await auth()
    if (!session?.user || !isClubManagerRole(session.user.role)) {
        redirect("/forbidden")
    }

    const { id } = await params
    const [clubResult, memberResult] = await Promise.all([
        getMyClubAction(),
        getClubMemberAction(id),
    ])

    if (!clubResult.ok) redirect("/forbidden")
    if (!memberResult.ok) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <ClubMemberEditForm
                    member={memberResult.data}
                    clubName={clubResult.data.name}
                />
            </div>
        </div>
    )
}
