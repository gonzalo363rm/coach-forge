import Link from "next/link"

import { ExerciseEditorDynamic } from "@/components/exercise-canvas/ExerciseEditorDynamic"
import { getExerciseCanvasAction } from "@/app/actions/exercises"
import { sportsListAll } from "@/services/sports.service"

interface Props {
    searchParams: Promise<{ from?: string; returnTo?: string }>
}

export default async function ExerciseNewPage({ searchParams }: Props) {
    const sportRows = await sportsListAll()
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    const params = await searchParams
    const fromId = params.from?.trim() ? params.from.trim() : null
    const returnTo = params.returnTo?.trim() ? params.returnTo.trim() : null

    const canvasResult = fromId ? await getExerciseCanvasAction(fromId) : null
    const initialExercise =
        canvasResult && canvasResult.ok
            ? {
                  title: "",
                  sportId: null,
                  minPlayers: null,
                  maxPlayers: null,
                  difficulty: 3,
                  isPublic: false,
                  videoLink: null,
                  canvas: canvasResult.data,
              }
            : null

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
                            ← Volver a la clase
                        </Link>
                    ) : null}
                    <h1 className="mt-2 text-2xl font-bold text-zinc-800 dark:text-white">
                        Nuevo ejercicio
                    </h1>
                    </div>
                </div>
                <ExerciseEditorDynamic
                    sports={sports}
                    initialExercise={initialExercise}
                    returnTo={returnTo}
                />
            </main>
        </div>
    )
}
