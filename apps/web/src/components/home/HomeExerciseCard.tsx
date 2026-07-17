import Link from "next/link"
import Image from "next/image"

import type { PublicHomeExercise } from "@/services/home-catalog.service"

const PLACEHOLDER = "/exercises/placeholder-preview.svg"

type Props = {
    exercise: PublicHomeExercise
    isLoggedIn: boolean
}

export function HomeExerciseCard({ exercise, isLoggedIn }: Props) {
    const templateHref = `/exercises/new?from=${encodeURIComponent(exercise.id)}&returnTo=${encodeURIComponent("/")}`

    return (
        <article className="flex w-44 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:w-52 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
                <Image
                    src={exercise.previewUrl}
                    alt={`Vista previa de ${exercise.title}`}
                    fill
                    sizes="(max-width: 640px) 176px, 208px"
                    unoptimized={exercise.previewUrl.endsWith(".svg")}
                    className="object-cover"
                />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {exercise.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Dificultad {exercise.difficulty} / 5
                </p>
                {isLoggedIn ? (
                    <Link
                        href={templateHref}
                        className="mt-auto inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/70"
                    >
                        Usar plantilla
                    </Link>
                ) : null}
            </div>
        </article>
    )
}

export { PLACEHOLDER as HOME_EXERCISE_PLACEHOLDER }
