import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getClubAdminByIdAction } from "@/app/actions/admin-clubs"
import { auth } from "@/auth"
import { AdminClubForm } from "@/components/admin/AdminClubForm"
import { createPageMetadata } from "@/lib/seo"
import { isStaffRole } from "@/lib/user-permissions"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar club",
    description: "Editá los datos y el cupo de un club.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function ClubEditPage({ params }: Props) {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    const { id } = await params
    const result = await getClubAdminByIdAction(id)
    if (!result.ok) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <AdminClubForm club={result.data} />
            </div>
        </div>
    )
}
