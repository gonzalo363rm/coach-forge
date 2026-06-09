"use client"

import { useCallback, useOptimistic, useTransition } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { deleteExerciseAction } from "@/app/actions/exercises"
import { ExercisePreviewThumb } from "@/components/exercises/ExercisePreviewThumb"
import { ExerciseRowActions } from "@/components/exercises/ExerciseRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import { SortableTh } from "@/components/ui/table/SortableTh"
import type { ExerciseListSortBy } from "@/schemas/exercise.schema"
import type { ExerciseListItem } from "@/services/exercises.service"
import { Sport } from "@prisma/client"

type Props = {
    exercises: ExerciseListItem[]
    totalPages: number
    sports: Sport[]
    listState: {
        search: string
        sport: string
        difficulty: string
        visibility: string
        sortBy: ExerciseListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    sport: Sport["slug"]
    difficulty: string
    visibility: string
}

function defaultSortDir(column: ExerciseListSortBy): "asc" | "desc" {
    switch (column) {
        case "title":
        case "sport":
            return "asc"
        case "difficulty":
        case "isPublic":
        case "updatedAt":
        default:
            return "desc"
    }
}

export function ExercisesPaginatedTable({
    exercises,
    totalPages,
    sports,
    listState,
}: Props) {
    const router = useRouter()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            sport: listState.sport,
            difficulty: listState.difficulty,
            visibility: listState.visibility,
        },
    })
    const [, startTransition] = useTransition()
    const [optimisticExercises, removeExerciseOptimistic] = useOptimistic(
        exercises,
        (current, deletedId: string) => current.filter((e) => e.id !== deletedId),
    )

    const deleteExercise = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    const result = await deleteExerciseAction(id)
                    if (result.ok) {
                        removeExerciseOptimistic(id)
                        router.refresh()
                        resolve({ ok: true })
                    } else {
                        resolve({ ok: false, error: result.error })
                    }
                })
            }),
        [removeExerciseOptimistic, router],
    )

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        if (data.sport) p.set("sport", data.sport)
        if (data.difficulty) p.set("difficulty", data.difficulty)
        if (data.visibility) p.set("visibility", data.visibility)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/exercises/list?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-wrap items-center justify-start gap-3"
            >
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar"
                    className="min-w-32 flex-1 rounded border border-zinc-300 bg-white p-0.5 dark:border-zinc-600 dark:bg-zinc-700 sm:max-w-xs"
                />

                <select
                    id="difficulty"
                    {...register("difficulty")}
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="">Todas las dificultades</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={String(n)}>
                            {n} / 5
                        </option>
                    ))}
                </select>

                <select
                    id="sport"
                    {...register("sport")}
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="">Todos los deportes</option>
                    {sports.map((sport) => (
                        <option key={sport.id} value={sport.slug}>
                            {sport.name}
                        </option>
                    ))}
                </select>

                <select
                    id="visibility"
                    {...register("visibility")}
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="">Todas</option>
                    <option value="public">Públicos</option>
                    <option value="private">Privados</option>
                </select>

                <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                    Buscar
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Vista previa
                                </th>
                                <SortableTh
                                    column="title"
                                    label="Título"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("title")}
                                />
                                <SortableTh
                                    column="difficulty"
                                    label="Dificultad"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("difficulty")}
                                />
                                <SortableTh
                                    column="sport"
                                    label="Deporte"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("sport")}
                                />
                                <SortableTh
                                    column="isPublic"
                                    label="Visibilidad"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("isPublic")}
                                />
                                <SortableTh
                                    column="updatedAt"
                                    label="Actualizado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("updatedAt")}
                                />
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticExercises.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay ejercicios con estos filtros.{" "}
                                        <Link
                                            href="/exercises/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear el primero
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                optimisticExercises.map((exercise) => {
                                    const exerciceSport = sports?.find(
                                        (sport) => sport.id === exercise.sportId,
                                    )
                                    const sportName = exerciceSport?.name || ""

                                    return (
                                        <tr
                                            key={exercise.id}
                                            className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 align-middle">
                                                <ExercisePreviewThumb
                                                    previewUrl={exercise.previewUrl}
                                                    title={exercise.title}
                                                />
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                <span className="line-clamp-2">
                                                    {exercise.title}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                {exercise.difficulty} / 5
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                {sportName}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                {exercise.isPublic ? "Público" : "Privado"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                {new Intl.DateTimeFormat("es", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                }).format(new Date(exercise.updatedAt))}
                                            </td>
                                            <td className="px-4 py-3 align-middle ">
                                                <ExerciseRowActions
                                                    id={exercise.id}
                                                    title={exercise.title}
                                                    deleteExercise={deleteExercise}
                                                />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination totalPages={totalPages} />
        </div>
    )
}
