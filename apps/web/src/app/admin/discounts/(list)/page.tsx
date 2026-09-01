/** Revalidación: catálogo de descuentos */
export const revalidate = 60

import type { Metadata } from "next"
import { ButtonLink } from "@/components/ui/button"

import { getDiscountsPaginatedAction } from "@/app/actions/discounts"
import { DiscountsPaginatedTable } from "@/components/discounts/DiscountsPaginatedTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"
import {
    catalogStatusSchema,
    discountListSortBySchema,
    type DiscountListSortBy,
} from "@/schemas/billing.schema"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Descuentos",
    description: "Administrá descuentos y códigos promocionales.",
    path: "/admin/discounts",
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
        status?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function DiscountsPage({ searchParams }: Props) {
    await requireSuperadminPage()

    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage
    const search = firstQueryValue(params.search) || null
    const statusParsed = catalogStatusSchema.safeParse(firstQueryValue(params.status))
    const sortByParsed = discountListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: DiscountListSortBy = sortByParsed.success ? sortByParsed.data : "name"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "desc" ? "desc" : "asc"
    const status = statusParsed.success ? statusParsed.data : null
    const listQueryKey = [page, search ?? "", status ?? "", sortBy, sortDir].join("|")

    const result = await getDiscountsPaginatedAction({
        page,
        filters: { search, status },
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
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">Descuentos</h1>
                    <ListNewLink href="/admin/discounts/new" ariaLabel="Nuevo descuento" />
                </header>
                <DiscountsPaginatedTable
                    key={listQueryKey}
                    discounts={result.data.discounts}
                    totalPages={result.data.totalPages}
                    listState={{
                        search: search ?? "",
                        status: status ?? "",
                        sortBy,
                        sortDir,
                    }}
                />
            </main>
        </div>
    )
}
