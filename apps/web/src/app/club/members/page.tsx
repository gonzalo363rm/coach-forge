import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getClubMembersPaginatedAction } from "@/app/actions/club"
import { auth } from "@/auth"
import { ClubMembersTable } from "@/components/club/ClubMembersTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { createPageMetadata } from "@/lib/seo"
import { isClubManagerRole } from "@/lib/user-permissions"
import {
    clubMemberListSortBySchema,
    type ClubMemberListSortBy,
} from "@/schemas/club.schema"

export const metadata: Metadata = createPageMetadata({
    title: "Coaches del club",
    description: "Gestioná los coaches de tu club.",
    path: "/club/members",
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

export default async function ClubMembersPage({ searchParams }: Props) {
    const session = await auth()
    if (!session?.user || !isClubManagerRole(session.user.role)) {
        redirect("/forbidden")
    }

    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null

    const sortByParsed = clubMemberListSortBySchema.safeParse(
        firstQueryValue(params.sortBy),
    )
    const sortBy: ClubMemberListSortBy = sortByParsed.success
        ? sortByParsed.data
        : "lastName"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "desc" ? "desc" : "asc"

    const listQueryKey = [page, search ?? "", sortBy, sortDir].join("|")
    const listState = {
        search: search ?? "",
        sortBy,
        sortDir,
    }

    const result = await getClubMembersPaginatedAction({
        page,
        filters: { search },
        sortBy,
        sortDir,
    })
    if (!result.ok) {
        redirect("/forbidden")
    }

    const { users, memberCount, maxMembers, totalPages } = result.data

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                            Coaches del club
                        </h1>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Creá y administrá los entrenadores de tu club.
                        </p>
                    </div>
                    <ListNewLink href="/club/members/new" ariaLabel="Nuevo coach" />
                </header>

                <ClubMembersTable
                    key={listQueryKey}
                    users={users}
                    memberCount={memberCount}
                    maxMembers={maxMembers}
                    totalPages={totalPages}
                    listState={listState}
                />
            </main>
        </div>
    )
}
