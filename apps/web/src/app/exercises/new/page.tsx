import { ExerciseEditor } from "@/components/exercise-canvas/ExerciseEditor"
import { getExerciseCanvasAction } from "@/app/actions/exercises"
import { elementsListAll } from "@/services/elements.service"
import { sportsListAll } from "@/services/sports.service"

interface Props {
    searchParams: Promise<{ from?: string }>
}

export default async function ExerciseNewPage({ searchParams }: Props) {
    const [sportRows, elements] = await Promise.all([sportsListAll(), elementsListAll()])
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    const params = await searchParams
    const fromId = params.from?.trim() ? params.from.trim() : null

    const canvasResult = fromId ? await getExerciseCanvasAction(fromId) : null
    const initialExercise =
        canvasResult && canvasResult.ok
            ? {
                  title: "",
                  sportId: null,
                  minPlayers: null,
                  maxPlayers: null,
                  difficulty: 3,
                  videoLink: null,
                  canvas: canvasResult.data,
              }
            : null

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full flex-1 flex-col gap-6 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Nuevo ejercicio</h1>
                </div>
                <ExerciseEditor sports={sports} elements={elements} initialExercise={initialExercise} />
            </main>
        </div>
    )
}
