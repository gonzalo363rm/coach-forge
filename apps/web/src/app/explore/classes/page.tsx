import type { Metadata } from "next"
import { Suspense } from "react"

import { auth } from "@/auth"
import { ExploreClassCard } from "@/components/explore/ExploreClassCard"
import { ExploreFilters } from "@/components/explore/ExploreFilters"
import { ExploreSubNav } from "@/components/explore/ExploreSubNav"
import { Pagination } from "@/components/ui/pagination/Pagination"
import { createPageMetadata } from "@/lib/seo"
import { getUserClubContext } from "@/services/clubs.service"
import { trainingClassesListPaginated } from "@/services/classes.service"
import { sportsListAll } from "@/services/sports.service"

export const revalidate = 60

export const metadata: Metadata = createPageMetadata({
    title: "Explorar clases",
    description: "Explorá clases públicas de la comunidad en Coach Forge.",
    path: "/explore/classes",
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

export default async function ExploreClassesPage({ searchParams }: Props) {
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
        trainingClassesListPaginated(page, 10, listFilters, {
            sortBy: "createdAt",
            sortDir,
        }),
        sportsListAll(),
    ])

    const classes = result.ok ? result.data.classes : []
    const totalPages = result.ok ? result.data.totalPages : 1
    const isLoggedIn = Boolean(session?.user)

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-8">
                <header className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Explorar
                    </p>
                    <ExploreSubNav active="classes" />
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                            Clases
                        </h1>
                        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                            Contenido público de la comunidad
                            {clubContext ? " o de tu club" : ""}. Filtrá por título, deporte,
                            dificultad y fecha.
                        </p>
                    </div>
                </header>

                <ExploreFilters
                    basePath="/explore/classes"
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
                ) : classes.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No hay clases con esos filtros.
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {classes.map((trainingClass) => (
                            <ExploreClassCard
                                key={trainingClass.id}
                                trainingClass={trainingClass}
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
