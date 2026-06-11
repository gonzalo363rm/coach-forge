import { auth } from "@/auth"
import { UserForm } from "@/components/users/UserForm"
import { isStaffRole } from "@/lib/user-permissions"
import { redirect } from "next/navigation"

export default async function UserNewPage() {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <UserForm mode="create" actorRole={session.user.role} />
            </div>
        </div>
    )
}
