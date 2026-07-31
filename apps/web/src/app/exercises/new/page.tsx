import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import { ExerciseEditorDynamic } from "@/components/exercise-canvas/ExerciseEditorDynamic"
import { getExerciseCanvasAction } from "@/app/actions/exercises"
import { getActorWithClub, getCreatorClubId } from "@/lib/content-access"
import { createPageMetadata } from "@/lib/seo"
import { canUseContentAsTemplate } from "@/lib/user-permissions"
import { exerciseGetById } from "@/services/exercises.service"
import { getUserClubContext } from "@/services/clubs.service"
import { sportsListAll } from "@/services/sports.service"

export const metadata: Metadata = createPageMetadata({
    title: "Nuevo ejercicio",
    description: "Creá un ejercicio visual con el editor 2D de Coach Forge.",
    path: "/exercises/new",
    noIndex: true,
})

interface Props {
    searchParams: Promise<{ from?: string; returnTo?: string }>
}

export default async function ExerciseNewPage({ searchParams }: Props) {
    const sportRows = await sportsListAll()
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    const params = await searchParams
    const fromId = params.from?.trim() ? params.from.trim() : null
    const returnTo = params.returnTo?.trim() ? params.returnTo.trim() : null

    const session = await auth()
    const clubContext = session?.user
        ? await getUserClubContext(session.user.id)
        : null
    const visibilityUser = session?.user
        ? {
              role: session.user.role,
              clubId: clubContext?.clubId ?? null,
          }
        : undefined

    let initialExercise = null
    if (fromId) {
        if (!session?.user) notFound()

        const source = await exerciseGetById(fromId)
        const actor = await getActorWithClub(session.user.id)
        const creatorClubId = await getCreatorClubId(source?.creatorId ?? null)
        if (
            !source ||
            !actor ||
            !canUseContentAsTemplate(
                actor,
                { visibility: source.visibility, creatorId: source.creatorId },
                creatorClubId,
            )
        ) {
            notFound()
        }

        const canvasResult = await getExerciseCanvasAction(fromId)
        initialExercise =
            canvasResult && canvasResult.ok
                ? {
                      title: "",
                      sportId: null,
                      minPlayers: null,
                      maxPlayers: null,
                      difficulty: 3,
                      visibility: "private" as const,
                      videoLink: null,
                      canvas: canvasResult.data,
                  }
                : null
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full flex-1 flex-col gap-6 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                    {returnTo ? (
                        <Link
                            href={returnTo}
                            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                            ← Volver
                        </Link>
                    ) : null}
                    <h1 className="mt-2 text-2xl font-bold text-zinc-800 dark:text-white">
                        {initialExercise ? "Nuevo ejercicio desde plantilla" : "Nuevo ejercicio"}
                    </h1>
                    </div>
                </div>
                <ExerciseEditorDynamic
                    sports={sports}
                    initialExercise={initialExercise}
                    returnTo={returnTo}
                    visibilityUser={visibilityUser}
                />
            </main>
        </div>
    )
}
