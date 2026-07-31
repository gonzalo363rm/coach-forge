/** Revalidación: lista de clubes */
export const revalidate = 60

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getClubsPaginatedAction } from "@/app/actions/admin-clubs"
import { auth } from "@/auth"
import { ClubsPaginatedTable } from "@/components/admin/ClubsPaginatedTable"
import { ButtonLink } from "@/components/ui/button"
import { createPageMetadata } from "@/lib/seo"
import { isStaffRole } from "@/lib/user-permissions"
import {
    clubListSortBySchema,
    type ClubListSortBy,
} from "@/schemas/club.schema"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Clubes",
    description: "Administrá los clubes y sus dueños.",
    path: "/admin/clubs",
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
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function ClubsListPage({ searchParams }: Props) {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null

    const sortByParsed = clubListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: ClubListSortBy = sortByParsed.success
        ? sortByParsed.data
        : "updatedAt"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "asc" ? "asc" : "desc"

    const listQueryKey = [page, search ?? "", sortBy, sortDir].join("|")
    const listState = {
        search: search ?? "",
        sortBy,
        sortDir,
    }

    const result = await getClubsPaginatedAction({
        page,
        filters: { search },
        sortBy,
        sortDir,
    })

    if (!result.ok) {
        return (
            <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
                <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">
                        {result.error}
                    </p>
                    <ButtonLink href="/" variant="primary">
                        Volver al inicio
                    </ButtonLink>
                </main>
            </div>
        )
    }

    const { clubs, totalPages } = result.data

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header>
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Clubes
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Consultá clubes, dueños y cupos de coaches.
                    </p>
                </header>

                <ClubsPaginatedTable
                    key={listQueryKey}
                    clubs={clubs}
                    totalPages={totalPages}
                    listState={listState}
                />
            </main>
        </div>
    )
}
