/** Revalidación: lista de ejercicios */
export const revalidate = 60

import type { Metadata } from "next"
import Link from "next/link"
import { ButtonLink } from "@/components/ui/button"

import { getExercisesPaginatedAction } from "@/app/actions/exercises"
import { ExercisesPaginatedTable } from "@/components/exercises/ExercisesPaginatedTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { createPageMetadata } from "@/lib/seo"
import { parseVisibilityFilter } from "@/lib/content-access"
import {
    exerciseListSortBySchema,
    type ExerciseListSortBy,
} from "@/schemas/exercise.schema"
import { sportsListAll } from "@/services/sports.service"
import { formatUserDisplayName } from "@/lib/user-display"
import { userGetById } from "@/services/users.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Ejercicios",
    description: "Administrá todos los ejercicios de la plataforma.",
    path: "/admin/exercises",
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
        creator?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function ExercisesListPage({ searchParams }: Props) {
    const params = await searchParams
    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage

    const search = firstQueryValue(params.search) || null
    const sport = firstQueryValue(params.sport) || null

    const rawDiff = firstQueryValue(params.difficulty)
    const difficultyNum =
        rawDiff === ""
            ? undefined
            : (() => {
                  const n = parseInt(rawDiff, 10)
                  if (Number.isNaN(n) || n < 1 || n > 5) return undefined
                  return n
              })()

    const visibilityRaw = firstQueryValue(params.visibility)
    const visibility = parseVisibilityFilter(visibilityRaw)

    const sortByParsed = exerciseListSortBySchema.safeParse(firstQueryValue(params.sortBy))
    const sortBy: ExerciseListSortBy = sortByParsed.success ? sortByParsed.data : "updatedAt"
    const sortDirRaw = firstQueryValue(params.sortDir)
    const sortDir: "asc" | "desc" = sortDirRaw === "asc" ? "asc" : "desc"

    const creatorId = firstQueryValue(params.creator) || null
    let initialCreatorLabel: string | null = null
    if (creatorId) {
        const creator = await userGetById(creatorId)
        if (creator) {
            initialCreatorLabel = formatUserDisplayName(creator)
        }
    }

    const listQueryKey = [
        page,
        search ?? "",
        sport ?? "",
        rawDiff,
        visibilityRaw,
        creatorId ?? "",
        sortBy,
        sortDir,
    ].join("|")
    const listState = {
        search: search ?? "",
        sport: sport ?? "",
        difficulty: difficultyNum !== undefined ? String(difficultyNum) : "",
        visibility: visibilityRaw,
        creator: creatorId ?? "",
        sortBy,
        sortDir,
    }

    const result = await getExercisesPaginatedAction({
        page,
        filters: {
            search,
            sport,
            difficulty: difficultyNum ?? null,
            visibility,
            creatorId,
        },
        sortBy,
        sortDir,
    })
    const fullListSports = await sportsListAll();

    if (!result.ok) {
        return (
            <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
                <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">{result.error}</p>
                    <ButtonLink href="/" variant="primary">Volver al inicio</ButtonLink>
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
                        Ejercicios
                    </h1>
                    <ListNewLink href="/exercises/new" ariaLabel="Nuevo ejercicio" />
                </header>

                <ExercisesPaginatedTable
                    key={listQueryKey}
                    exercises={exercises}
                    totalPages={totalPages}
                    sports={fullListSports}
                    listState={listState}
                    showCreatorFilter
                    initialCreatorLabel={initialCreatorLabel}
                />
            </main>
        </div>
    )
}
