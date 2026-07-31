import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getMyClubAction } from "@/app/actions/club"
import { auth } from "@/auth"
import { ClubSettingsForm } from "@/components/club/ClubSettingsForm"
import { createPageMetadata } from "@/lib/seo"
import { isClubManagerRole } from "@/lib/user-permissions"

export const metadata: Metadata = createPageMetadata({
    title: "Mi Club",
    description: "Datos y configuración de tu club.",
    path: "/club",
    noIndex: true,
})

export default async function ClubPage() {
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
                <ClubSettingsForm club={result.data} />
            </div>
        </div>
    )
}
