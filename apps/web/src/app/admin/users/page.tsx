/** Revalidación: lista de usuarios */
export const revalidate = 60

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"

import { getUsersPaginatedAction } from "@/app/actions/users"
import { auth } from "@/auth"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { UsersPaginatedTable } from "@/components/users/UsersPaginatedTable"
import { createPageMetadata } from "@/lib/seo"
import { filterableRolesForActor, isStaffRole } from "@/lib/user-permissions"
import {
    userListSortBySchema,
    type UserListSortBy,
} from "@/schemas/user.schema"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Usuarios",
    description: "Administrá los usuarios de la plataforma.",
    path: "/admin/users",
    noIndex: true,
})

function firstQueryValue(v: string | string[] | undefined): string {
    if (v === undefined) return ""
    return Array.isArray(v) ? (v[0] ?? "") : v
}

interface Props {
    searchParams: Promise<{
        page?: string | string[]
        search?: string | string[]
        role?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function UsersListPage({ searchParams }: Props) {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null
    const roleRaw = firstQueryValue(params.role)
    const allowedRoles = filterableRolesForActor(session.user.role)
    const role: Role | null = allowedRoles.includes(roleRaw as Role)
        ? (roleRaw as Role)
        : null

    const sortByParsed = userListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: UserListSortBy = sortByParsed.success ? sortByParsed.data : "updatedAt"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "asc" ? "asc" : "desc"

    const listQueryKey = [page, search ?? "", roleRaw, sortBy, sortDir].join("|")
    const listState = {
        search: search ?? "",
        role: roleRaw,
        sortBy,
        sortDir,
    }

    const result = await getUsersPaginatedAction({
        page,
        filters: { search, role },
        sortBy,
        sortDir,
    })

    if (!result.ok) {
        return (
            <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
                <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">{result.error}</p>
                    <Link
                        href="/"
                        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                        Volver al inicio
                    </Link>
                </main>
            </div>
        )
    }

    const { users, totalPages } = result.data

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Usuarios
                    </h1>
                    <ListNewLink href="/admin/users/new" ariaLabel="Nuevo usuario" />
                </header>

                <UsersPaginatedTable
                    key={listQueryKey}
                    users={users}
                    totalPages={totalPages}
                    actorRole={session.user.role}
                    actorId={session.user.id}
                    listState={listState}
                />
            </main>
        </div>
    )
}
