import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { UserForm } from "@/components/users/UserForm"
import { createPageMetadata } from "@/lib/seo"
import { canAdminViewUser, isStaffRole } from "@/lib/user-permissions"
import { userGetById } from "@/services/users.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar usuario",
    description: "Editá un usuario de la plataforma.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function UserEditPage({ params }: Props) {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    const { id } = await params
    const user = await userGetById(id)
    if (!user) notFound()
    if (!canAdminViewUser(session.user.role, session.user.id, user)) {
        notFound()
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <UserForm mode="edit" user={user} actorRole={session.user.role} />
            </div>
        </div>
    )
}
