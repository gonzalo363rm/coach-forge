import { ExercisePreviewThumb } from "@/components/exercises/ExercisePreviewThumb"
import type { PublicHomeExercise } from "@/services/home-catalog.service"

import { HomeExerciseCardActions } from "./HomeExerciseCardActions"

const PLACEHOLDER = "/exercises/placeholder-preview.svg"

type Props = {
    exercise: PublicHomeExercise
    isLoggedIn: boolean
    currentUserId?: string | null
}

export function HomeExerciseCard({ exercise, isLoggedIn, currentUserId = null }: Props) {
    const templateHref = `/exercises/new?from=${encodeURIComponent(exercise.id)}&returnTo=${encodeURIComponent("/")}`
    const isOwn = Boolean(currentUserId && exercise.creatorId === currentUserId)

    return (
        <article className="flex w-44 shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:w-52 dark:border-zinc-800 dark:bg-zinc-950">
            <ExercisePreviewThumb
                previewUrl={exercise.previewUrl}
                title={exercise.title}
                className="w-full rounded-none"
                imageClassName="relative block aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900"
                sizes="(max-width: 640px) 176px, 208px"
            />
            <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {exercise.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Dificultad {exercise.difficulty} / 5
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

export { PLACEHOLDER as HOME_EXERCISE_PLACEHOLDER }
