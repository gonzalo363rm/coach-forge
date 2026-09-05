import type { Metadata } from "next"
import { Suspense } from "react"

import { auth } from "@/auth"
import { ExploreExerciseCard } from "@/components/explore/ExploreExerciseCard"
import { ExploreFilters } from "@/components/explore/ExploreFilters"
import { ExploreSubNav } from "@/components/explore/ExploreSubNav"
import { Pagination } from "@/components/ui/pagination/Pagination"
import { createPageMetadata } from "@/lib/seo"
import { getUserClubContext } from "@/services/clubs.service"
import { exercisesListPaginated } from "@/services/exercises.service"
import { sportsListAll } from "@/services/sports.service"

export const revalidate = 60

export const metadata: Metadata = createPageMetadata({
    title: "Explorar ejercicios",
    description: "Explorá ejercicios públicos de la comunidad en Coach Forge.",
    path: "/explore/exercises",
})

function firstQueryValue(v: string | string[] | undefined): string {
    if (v === undefined) return ""
    return Array.isArray(v) ? (v[0] ?? "") : v
}

type Props = {
    searchParams: Promise<{
        page?: string | string[]
        search?: string | string[]
        sport?: string | string[]
        difficulty?: string | string[]
        sortDir?: string | string[]
        scope?: string | string[]
    }>
}

export default async function ExploreExercisesPage({ searchParams }: Props) {
    const session = await auth()
    const params = await searchParams
    const clubContext = session?.user
        ? await getUserClubContext(session.user.id)
        : null

    const rawPage = firstQueryValue(params.page)
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
    const search = firstQueryValue(params.search)
    const sport = firstQueryValue(params.sport)
    const rawDifficulty = firstQueryValue(params.difficulty)
    const difficultyParsed = rawDifficulty ? parseInt(rawDifficulty, 10) : NaN
    const difficulty =
        Number.isInteger(difficultyParsed) &&
        difficultyParsed >= 1 &&
        difficultyParsed <= 5
            ? difficultyParsed
            : null
    const sortDir = firstQueryValue(params.sortDir) === "asc" ? "asc" : "desc"
    const scopeRaw = firstQueryValue(params.scope)
    const scope =
        scopeRaw === "club" && clubContext ? ("club" as const) : ("community" as const)

    const listFilters =
        scope === "club" && clubContext
            ? {
                  search: search || null,
                  sport: sport || null,
                  ...(difficulty !== null ? { difficulty } : {}),
                  clubId: clubContext.clubId,
              }
            : {
                  search: search || null,
                  sport: sport || null,
                  ...(difficulty !== null ? { difficulty } : {}),
                  visibility: "public" as const,
              }

    const [result, sports] = await Promise.all([
        exercisesListPaginated(page, 12, listFilters, {
            sortBy: "createdAt",
            sortDir,
        }),
        sportsListAll(),
    ])

    const exercises = result.ok ? result.data.exercises : []
    const totalPages = result.ok ? result.data.totalPages : 1
    const isLoggedIn = Boolean(session?.user)

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-8">
                <header className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Explorar
                    </p>
                    <ExploreSubNav active="exercises" />
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                            Ejercicios
                        </h1>
                        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                            Contenido público de la comunidad
                            {clubContext ? " o de tu club" : ""}. Filtrá por título, deporte,
                            dificultad y fecha.
                        </p>
                    </div>
                </header>

                <ExploreFilters
                    basePath="/explore/exercises"
                    search={search}
                    sport={sport}
                    difficulty={difficulty !== null ? String(difficulty) : ""}
                    sortDir={sortDir}
                    scope={scope}
                    showClubScope={Boolean(clubContext)}
                    clubName={clubContext?.clubName}
                    sports={sports.map((s) => ({ slug: s.slug, name: s.name }))}
                />

                {!result.ok ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                ) : exercises.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No hay ejercicios con esos filtros.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {exercises.map((exercise) => (
                            <ExploreExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                isLoggedIn={isLoggedIn}
                                currentUserId={session?.user?.id ?? null}
                            />
                        ))}
                    </div>
                )}

                {result.ok && totalPages > 1 ? (
                    <Suspense fallback={null}>
                        <Pagination totalPages={totalPages} />
                    </Suspense>
                ) : null}
            </main>
        </div>
    )
}
