import Link from "next/link"

import { ExerciseEditor } from "@/components/exercise-canvas/ExerciseEditor"
import type { ExerciseCanvas as ExerciseCanvasData } from "@/interfaces"
import { elementsListAll } from "@/services/elements.service"
import { exerciseGetById } from "@/services/exercises.service"
import { sportsListAll } from "@/services/sports.service"
import { notFound } from "next/navigation"

interface Props {
    params: Promise<{ id: string }>
    searchParams: Promise<{ returnTo?: string }>
}

export default async function EditExercisePage({ params, searchParams }: Props) {
    const { id } = await params
    const sp = await searchParams
    const returnTo = sp.returnTo?.trim() ? sp.returnTo.trim() : null
    const [row, sportRows, elements] = await Promise.all([
        exerciseGetById(id),
        sportsListAll(),
        elementsListAll(),
    ])
    if (!row) notFound()
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    const initialExercise = {
        id: row.id,
        title: row.title,
        sportId: row.sportId,
        minPlayers: row.minPlayers,
        maxPlayers: row.maxPlayers,
        difficulty: row.difficulty,
        videoLink: row.videoLink,
        canvas: row.canvas as unknown as ExerciseCanvasData,
    }

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
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
                        Editar ejercicio
                    </h1>
                    </div>
                </div>
                <ExerciseEditor
                    initialExercise={initialExercise}
                    sports={sports}
                    elements={elements}
                    returnTo={returnTo}
                />
            </main>
        </div>
    )
}
