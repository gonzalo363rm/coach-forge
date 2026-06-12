/** Revalidación: mis clases */
export const revalidate = 60

import Link from "next/link"

import { getMyTrainingClassesPaginatedAction } from "@/app/actions/classes"
import { ClassesPaginatedTable } from "@/components/classes/ClassesPaginatedTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import {
    trainingClassListSortBySchema,
    type TrainingClassListSortBy,
} from "@/schemas/training-class.schema"
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
        difficulty?: string | string[]
        visibility?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function MyClassesPage({ searchParams }: Props) {
    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null
    const sport = firstQueryValue(params.sport) || null

    const rawDiff = firstQueryValue(params.difficulty)
    const difficultyNum =
        rawDiff === ""
            ? null
            : (() => {
                  const n = parseInt(rawDiff, 10)
                  if (Number.isNaN(n) || n < 1 || n > 5) return null
                  return n
              })()

    const visibilityRaw = firstQueryValue(params.visibility)
    const isPublic =
        visibilityRaw === "public" ? true : visibilityRaw === "private" ? false : null

    const sortByParsed = trainingClassListSortBySchema.safeParse(
        firstQueryValue(params.sortBy),
    )
    const sortBy: TrainingClassListSortBy = sortByParsed.success
        ? sortByParsed.data
        : "updatedAt"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "asc" ? "asc" : "desc"

    const listQueryKey = [
        page,
        search ?? "",
        sport ?? "",
        rawDiff,
        visibilityRaw,
        sortBy,
        sortDir,
    ].join("|")
    const listState = {
        search: search ?? "",
        sport: sport ?? "",
        difficulty: difficultyNum !== null ? String(difficultyNum) : "",
        visibility: visibilityRaw,
        creator: "",
        sortBy,
        sortDir,
    }

    const [result, sports] = await Promise.all([
        getMyTrainingClassesPaginatedAction({
            page,
            filters: {
                search,
                sport,
                difficulty: difficultyNum,
                isPublic,
            },
            sortBy,
            sortDir,
        }),
        sportsListAll(),
    ])

    if (!result.ok) {
        return (
            <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
                <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">
                        {result.error}
                    </p>
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

    const { classes, totalPages } = result.data

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Mis clases
                    </h1>
                    <ListNewLink href="/classes/new" ariaLabel="Nueva clase" />
                </header>

                <ClassesPaginatedTable
                    key={listQueryKey}
                    classes={classes}
                    totalPages={totalPages}
                    sports={sports}
                    listState={listState}
                    listBasePath="/classes/mine"
                    hideClassMetrics
                />
            </main>
        </div>
    )
}
