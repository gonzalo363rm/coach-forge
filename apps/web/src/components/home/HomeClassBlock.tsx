import { HeaderAvatar } from "@/components/auth/HeaderAvatar"
import { ExercisePreviewThumb } from "@/components/exercises/ExercisePreviewThumb"
import { ButtonLink } from "@/components/ui/button"
import { formatUserDisplayName } from "@/lib/user-display"
import type { PublicHomeClass } from "@/services/home-catalog.service"

import { HorizontalScrollStrip } from "./HorizontalScrollStrip"

type Props = {
    trainingClass: PublicHomeClass
    isLoggedIn: boolean
}

function formatClassDate(iso: string): string {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(iso))
}

export function HomeClassBlock({ trainingClass, isLoggedIn }: Props) {
    const templateHref = `/classes/new?from=${encodeURIComponent(trainingClass.id)}&returnTo=${encodeURIComponent("/")}`
    const startHref = `/classes/${trainingClass.id}/start`
    const creatorName = trainingClass.creator
        ? formatUserDisplayName(trainingClass.creator)
        : "Entrenador"

    return (
        <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    {trainingClass.creator ? (
                        <HeaderAvatar
                            avatarUrl={trainingClass.creator.avatarUrl}
                            firstName={trainingClass.creator.firstName}
                            lastName={trainingClass.creator.lastName}
                            size="md"
                        />
                    ) : (
                        <div className="size-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {creatorName}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {[
                                trainingClass.sportName ?? "Sin deporte",
                                `Dificultad ${trainingClass.difficulty} / 5`,
                                formatClassDate(trainingClass.createdAt),
                            ].join(" · ")}
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {trainingClass.title}
                        </h3>
                        {trainingClass.description?.trim() ? (
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                                {trainingClass.description.trim()}
                            </p>
                        ) : null}
                    </div>
                </div>

                {isLoggedIn ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <ButtonLink href={startHref} variant="primary" size="sm">
                            Comenzar
                        </ButtonLink>
                        <ButtonLink href={templateHref} variant="soft" size="sm">
                            Usar plantilla
                        </ButtonLink>
                    </div>
                ) : null}
            </div>

            {trainingClass.exercises.length > 0 ? (
                <div className="px-4 py-4">
                    <HorizontalScrollStrip
                        ariaLabel={`Ejercicios de ${trainingClass.title}`}
                        className="px-1"
                    >
                        {trainingClass.exercises.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="flex w-36 shrink-0 snap-start flex-col gap-2 sm:w-40"
                            >
                                <ExercisePreviewThumb
                                    previewUrl={exercise.previewUrl}
                                    title={exercise.title}
                                    className="w-full"
                                    imageClassName="relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
                                    sizes="160px"
                                />
                                <p className="line-clamp-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                    {exercise.title}
                                </p>
                            </div>
                        ))}
                    </HorizontalScrollStrip>
                </div>
            ) : (
                <p className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Sin ejercicios en esta clase.
                </p>
            )}
        </article>
    )
}
