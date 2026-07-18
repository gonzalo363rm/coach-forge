import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { UserForm } from "@/components/users/UserForm"
import { createPageMetadata } from "@/lib/seo"
import { isStaffRole } from "@/lib/user-permissions"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Nuevo usuario",
    description: "Creá un nuevo usuario en la plataforma.",
    path: "/admin/users/new",
    noIndex: true,
})

export default async function UserNewPage() {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <UserForm mode="create" actorRole={session.user.role} />
            </div>
        </div>
    )
}
