/** Revalidación: lista de usuarios */
export const revalidate = 60

import Link from "next/link"

import { getUsersPaginatedAction } from "@/app/actions/users"
import { UsersPaginatedTable } from "@/components/users/UsersPaginatedTable"
import {
    userListSortBySchema,
    type UserListSortBy,
} from "@/schemas/user.schema"
import type { Role } from "@prisma/client"

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
    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null
    const roleRaw = firstQueryValue(params.role)
    const role: Role | null =
        roleRaw === "admin" || roleRaw === "coach" ? roleRaw : null

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
            <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
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
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                            Usuarios
                        </h1>
                        <Link
                            href="/users/new"
                            aria-label="Nuevo usuario"
                            title="Nuevo usuario"
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-300 text-xl font-semibold leading-none text-emerald-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 dark:border-zinc-600 dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40"
                        >
                            +
                        </Link>
                    </div>
                </header>

                <UsersPaginatedTable
                    key={listQueryKey}
                    users={users}
                    totalPages={totalPages}
                    listState={listState}
                />
            </main>
        </div>
    )
}
