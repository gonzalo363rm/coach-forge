import { auth } from "@/auth"
import { UserForm } from "@/components/users/UserForm"
import { canAdminViewUser, isStaffRole } from "@/lib/user-permissions"
import { userGetById } from "@/services/users.service"
import { notFound, redirect } from "next/navigation"

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
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <UserForm mode="edit" user={user} actorRole={session.user.role} />
            </div>
        </div>
    )
}
