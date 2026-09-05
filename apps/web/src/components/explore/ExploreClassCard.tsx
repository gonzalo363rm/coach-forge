import { HeaderAvatar } from "@/components/auth/HeaderAvatar"
import { HomeClassBlockActions } from "@/components/home/HomeClassBlockActions"
import { formatUserDisplayName } from "@/lib/user-display"

type Props = {
    trainingClass: {
        id: string
        title: string
        description: string | null
        difficulty: number
        createdAt: Date | string
        sport: { name: string; slug: string } | null
        creator: {
            id: string
            firstName: string
            lastName: string
            avatarUrl: string | null
        } | null
        exerciseCount: number
        totalMinutes: number
    }
    isLoggedIn: boolean
    currentUserId?: string | null
    returnTo?: string
}

function formatDate(value: Date | string): string {
    const d = typeof value === "string" ? new Date(value) : value
    return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(d)
}

export function ExploreClassCard({
    trainingClass,
    isLoggedIn,
    currentUserId = null,
    returnTo = "/explore/classes",
}: Props) {
    const templateHref = `/classes/new?from=${encodeURIComponent(trainingClass.id)}&returnTo=${encodeURIComponent(returnTo)}`
    const startHref = `/classes/${trainingClass.id}/start`
    const isOwn = Boolean(
        currentUserId && trainingClass.creator && trainingClass.creator.id === currentUserId,
    )
    const creatorName = trainingClass.creator
        ? formatUserDisplayName(trainingClass.creator)
        : "Entrenador"

    return (
        <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-4 p-4">
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
                                trainingClass.sport?.name ?? "Sin deporte",
                                `Dificultad ${trainingClass.difficulty} / 5`,
                                formatDate(trainingClass.createdAt),
                                `${trainingClass.exerciseCount} ejercicio${trainingClass.exerciseCount === 1 ? "" : "s"}`,
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
                    <HomeClassBlockActions
                        classId={trainingClass.id}
                        title={trainingClass.title}
                        startHref={startHref}
                        templateHref={templateHref}
                        isOwn={isOwn}
                    />
                ) : null}
            </div>
        </article>
    )
}
