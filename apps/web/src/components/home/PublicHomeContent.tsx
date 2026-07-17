import Link from "next/link"

import type { PublicHomeCatalog } from "@/services/home-catalog.service"

import { HomeClassBlock } from "./HomeClassBlock"
import { HomeExerciseCard } from "./HomeExerciseCard"
import { HorizontalScrollStrip } from "./HorizontalScrollStrip"

type Props = {
    catalog: PublicHomeCatalog
    isLoggedIn: boolean
    firstName?: string
}

export function PublicHomeContent({ catalog, isLoggedIn, firstName }: Props) {
    const { exerciseSections, classes, unavailable } = catalog
    const hasExercises = exerciseSections.some((s) => s.exercises.length > 0)
    const hasClasses = classes.length > 0
    const isEmpty = !hasExercises && !hasClasses

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 p-6 sm:p-8">
                <header className="space-y-3">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        {firstName ? `Hola, ${firstName}` : "Coach Forge"}
                    </h1>
                    <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                        {isLoggedIn
                            ? "Explorá ejercicios y clases públicas. Usá una plantilla para crear tu versión o comenzá una sesión."
                            : "Explorá ejercicios y clases de la comunidad. Iniciá sesión para usar plantillas."}
                    </p>
                </header>

                {unavailable ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-12 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
                        <p className="text-sm text-amber-900 dark:text-amber-200">
                            No pudimos cargar el catálogo. Intentá de nuevo en unos segundos.
                        </p>
                    </div>
                ) : isEmpty ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-100 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Todavía no hay ejercicios ni clases públicas.
                        </p>
                    </div>
                ) : (
                    <>
                        {hasExercises ? (
                            <section className="space-y-8" aria-labelledby="home-exercises-heading">
                                <h2
                                    id="home-exercises-heading"
                                    className="text-xl font-bold text-zinc-800 dark:text-white"
                                >
                                    Ejercicios por deporte
                                </h2>
                                {exerciseSections.map((section) =>
                                    section.exercises.length > 0 ? (
                                        <div key={section.sportId ?? "none"} className="space-y-3">
                                            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                                                {section.sportName}
                                            </h3>
                                            <HorizontalScrollStrip
                                                ariaLabel={`Ejercicios de ${section.sportName}`}
                                                className="px-2"
                                            >
                                                {section.exercises.map((exercise) => (
                                                    <HomeExerciseCard
                                                        key={exercise.id}
                                                        exercise={exercise}
                                                        isLoggedIn={isLoggedIn}
                                                    />
                                                ))}
                                            </HorizontalScrollStrip>
                                        </div>
                                    ) : null,
                                )}
                            </section>
                        ) : null}

                        {hasClasses ? (
                            <section className="space-y-4" aria-labelledby="home-classes-heading">
                                <h2
                                    id="home-classes-heading"
                                    className="text-xl font-bold text-zinc-800 dark:text-white"
                                >
                                    Clases recientes
                                </h2>
                                <div className="flex flex-col gap-6">
                                    {classes.map((trainingClass) => (
                                        <HomeClassBlock
                                            key={trainingClass.id}
                                            trainingClass={trainingClass}
                                            isLoggedIn={isLoggedIn}
                                        />
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </>
                )}
            </main>
        </div>
    )
}
