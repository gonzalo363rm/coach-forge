/** Revalidación: lista de elementos */
export const revalidate = 60

import Link from "next/link"

import { getElementsPaginatedAction } from "@/app/actions/elements"
import { ElementsPaginatedTable } from "@/components/elements/ElementsPaginatedTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { elementListSortBySchema, type ElementListSortBy } from "@/schemas/element.schema"
import { sportsListAll } from "@/services/sports.service"

function firstQueryValue(v: string | string[] | undefined): string {
    if (v === undefined) return ""
    return Array.isArray(v) ? (v[0] ?? "") : v
}

interface Props {
    searchParams: Promise<{
        page?: string | string[]
        search?: string | string[]
        sport?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function ElementsListPage({ searchParams }: Props) {
    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null
    const sport = firstQueryValue(params.sport) || null

    const sortByParsed = elementListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: ElementListSortBy = sortByParsed.success ? sortByParsed.data : "updatedAt"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "asc" ? "asc" : "desc"

    const listQueryKey = [page, search ?? "", sport ?? "", sortBy, sortDir].join("|")
    const listState = {
        search: search ?? "",
        sport: sport ?? "",
        sortBy,
        sortDir,
    }

    const result = await getElementsPaginatedAction({
        page,
        filters: { search, sport },
        sortBy,
        sortDir,
    })
    const fullListSports = await sportsListAll()

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

    const { elements, totalPages } = result.data

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Elementos
                    </h1>
                    <ListNewLink href="/admin/elements/new" ariaLabel="Nuevo elemento" />
                </header>

                <ElementsPaginatedTable
                    key={listQueryKey}
                    elements={elements}
                    totalPages={totalPages}
                    sports={fullListSports}
                    listState={listState}
                />
            </main>
        </div>
    )
}
