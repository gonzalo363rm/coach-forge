import { HomeExerciseCardActions } from "@/components/home/HomeExerciseCardActions"
import { ExercisePreviewThumb } from "@/components/exercises/ExercisePreviewThumb"

type Props = {
    exercise: {
        id: string
        title: string
        difficulty: number
        previewUrl: string
        creatorId: string | null
        createdAt: Date | string
    }
    isLoggedIn: boolean
    currentUserId?: string | null
    returnTo?: string
}

function formatDate(value: Date | string): string {
    const d = typeof value === "string" ? new Date(value) : value
    return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(d)
}

export function ExploreExerciseCard({
    exercise,
    isLoggedIn,
    currentUserId = null,
    returnTo = "/explore/exercises",
}: Props) {
    const templateHref = `/exercises/new?from=${encodeURIComponent(exercise.id)}&returnTo=${encodeURIComponent(returnTo)}`
    const isOwn = Boolean(currentUserId && exercise.creatorId === currentUserId)

    return (
        <article className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <ExercisePreviewThumb
                previewUrl={exercise.previewUrl}
                title={exercise.title}
                className="w-full rounded-none"
                imageClassName="relative block aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900"
                sizes="(max-width: 640px) 50vw, 25vw"
            />
            <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {exercise.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Dificultad {exercise.difficulty} / 5 · {formatDate(exercise.createdAt)}
                </p>
                {isLoggedIn ? (
                    <HomeExerciseCardActions
                        exerciseId={exercise.id}
                        title={exercise.title}
                        templateHref={templateHref}
                        isOwn={isOwn}
                    />
                ) : null}
            </div>
        </article>
    )
}
