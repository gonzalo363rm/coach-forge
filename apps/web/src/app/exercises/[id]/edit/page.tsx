import { ExerciseEditor } from "@/components/exercise-canvas/ExerciseEditor"
import type { ExerciseCanvas as ExerciseCanvasData } from "@/interfaces"
import { exerciseGetById } from "@/services/exercises.service"
import { sportsListAll } from "@/services/sports.service"
import { notFound } from "next/navigation"

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditExercisePage({ params }: Props) {
    const { id } = await params
    const [row, sportRows] = await Promise.all([exerciseGetById(id), sportsListAll()])
    if (!row) notFound()
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name }))

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
                    <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Editar ejercicio</h1>
                </div>
                <ExerciseEditor initialExercise={initialExercise} sports={sports} />
            </main>
        </div>
    )
}
