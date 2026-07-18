import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { UserForm } from "@/components/users/UserForm"
import { createPageMetadata } from "@/lib/seo"
import { userGetById } from "@/services/users.service"

export const metadata: Metadata = createPageMetadata({
    title: "Mi perfil",
    description: "Editá tus datos de perfil y avatar en Coach Forge.",
    path: "/profile",
    noIndex: true,
})

export default async function ProfilePage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const user = await userGetById(session.user.id)
    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <UserForm mode="profile" user={user} />
            </div>
        </div>
    )
}
