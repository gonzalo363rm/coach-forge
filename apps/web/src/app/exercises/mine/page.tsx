/** Revalidación: mis ejercicios */
export const revalidate = 60

import type { Metadata } from "next"
import Link from "next/link"

import { getMyExercisesPaginatedAction } from "@/app/actions/exercises"
import { ExercisesPaginatedTable } from "@/components/exercises/ExercisesPaginatedTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { createPageMetadata } from "@/lib/seo"
import {
    exerciseListSortBySchema,
    type ExerciseListSortBy,
} from "@/schemas/exercise.schema"
import { sportsListAll } from "@/services/sports.service"

export const metadata: Metadata = createPageMetadata({
    title: "Mis ejercicios",
    description: "Listá, editá y organizá tus ejercicios de entrenamiento en Coach Forge.",
    path: "/exercises/mine",
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
        sport?: string | string[]
        difficulty?: string | string[]
        visibility?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function MyExercisesPage({ searchParams }: Props) {
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

    const sortByParsed = exerciseListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: ExerciseListSortBy = sortByParsed.success ? sortByParsed.data : "updatedAt"
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
        getMyExercisesPaginatedAction({
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

    const { exercises, totalPages } = result.data

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Mis ejercicios
                    </h1>
                    <ListNewLink href="/exercises/new" ariaLabel="Nuevo ejercicio" />
                </header>

                <ExercisesPaginatedTable
                    key={listQueryKey}
                    exercises={exercises}
                    totalPages={totalPages}
                    sports={sports}
                    listState={listState}
                    listBasePath="/exercises/mine"
                />
            </main>
        </div>
    )
}
