/** Revalidación: catálogo de planes */
export const revalidate = 60

import type { Metadata } from "next"
import { ButtonLink } from "@/components/ui/button"

import { getPlansPaginatedAction } from "@/app/actions/plans"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { PlansPaginatedTable } from "@/components/plans/PlansPaginatedTable"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"
import {
    catalogStatusSchema,
    planListSortBySchema,
    planTypeSchema,
    type PlanListSortBy,
} from "@/schemas/billing.schema"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Planes",
    description: "Administrá los planes comerciales de la plataforma.",
    path: "/admin/plans",
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
        type?: string | string[]
        status?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function PlansPage({ searchParams }: Props) {
    await requireSuperadminPage()

    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage
    const search = firstQueryValue(params.search) || null
    const typeParsed = planTypeSchema.safeParse(firstQueryValue(params.type))
    const statusParsed = catalogStatusSchema.safeParse(firstQueryValue(params.status))
    const sortByParsed = planListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: PlanListSortBy = sortByParsed.success ? sortByParsed.data : "name"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "desc" ? "desc" : "asc"

    const type = typeParsed.success ? typeParsed.data : null
    const status = statusParsed.success ? statusParsed.data : null
    const listQueryKey = [page, search ?? "", type ?? "", status ?? "", sortBy, sortDir].join("|")

    const result = await getPlansPaginatedAction({
        page,
        filters: { search, type, status },
        sortBy,
        sortDir,
    })

    if (!result.ok) {
        return (
            <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
                <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">{result.error}</p>
                    <ButtonLink href="/" variant="primary">
                        Volver al inicio
                    </ButtonLink>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">Planes</h1>
                    <ListNewLink href="/admin/plans/new" ariaLabel="Nuevo plan" />
                </header>
                <PlansPaginatedTable
                    key={listQueryKey}
                    plans={result.data.plans}
                    totalPages={result.data.totalPages}
                    listState={{
                        search: search ?? "",
                        type: type ?? "",
                        status: status ?? "",
                        sortBy,
                        sortDir,
                    }}
                />
            </main>
        </div>
    )
}
