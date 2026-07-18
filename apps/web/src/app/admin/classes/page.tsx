/** Revalidación: lista de clases */
export const revalidate = 60

import type { Metadata } from "next"
import Link from "next/link"
import { ButtonLink } from "@/components/ui/button"

import { getTrainingClassesPaginatedAction } from "@/app/actions/classes"
import { ClassesPaginatedTable } from "@/components/classes/ClassesPaginatedTable"
import { ListNewLink } from "@/components/ui/ListNewLink"
import { createPageMetadata } from "@/lib/seo"
import {
    trainingClassListSortBySchema,
    type TrainingClassListSortBy,
} from "@/schemas/training-class.schema"
import { sportsListAll } from "@/services/sports.service"
import { formatUserDisplayName } from "@/lib/user-display"
import { userGetById } from "@/services/users.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Clases",
    description: "Administrá todas las clases de entrenamiento de la plataforma.",
    path: "/admin/classes",
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

export default async function ClassesListPage({ searchParams }: Props) {
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
        difficulty: difficultyNum !== null ? String(difficultyNum) : "",
        visibility: visibilityRaw,
        creator: creatorId ?? "",
        sortBy,
        sortDir,
    }

    const [result, sports] = await Promise.all([
        getTrainingClassesPaginatedAction({
            page,
            filters: {
                search,
                sport,
                difficulty: difficultyNum,
                isPublic,
                creatorId,
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
                    <ButtonLink href="/" variant="primary">Volver al inicio</ButtonLink>
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
                        Clases
                    </h1>
                    <ListNewLink href="/classes/new" ariaLabel="Nueva clase" />
                </header>

                <ClassesPaginatedTable
                    key={listQueryKey}
                    classes={classes}
                    totalPages={totalPages}
                    sports={sports}
                    listState={listState}
                    showCreatorFilter
                    initialCreatorLabel={initialCreatorLabel}
                />
            </main>
        </div>
    )
}
