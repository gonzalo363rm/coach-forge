"use client"

import { deleteTrainingClassAction } from "@/app/actions/classes"
import { ClassRowActions } from "@/components/classes/ClassRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { useToast } from "@/components/ui/toast/ToastProvider"
import type { TrainingClassListSortBy } from "@/schemas/training-class.schema"
import type { TrainingClassListItem } from "@/services/classes.service"
import type { Sport } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useOptimistic, useTransition } from "react"
import { useForm } from "react-hook-form"

type Props = {
    classes: TrainingClassListItem[]
    totalPages: number
    sports: Sport[]
    listState: {
        search: string
        sport: string
        difficulty: string
        visibility: string
        sortBy: TrainingClassListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    sport: string
    difficulty: string
    visibility: string
}

function defaultSortDir(column: TrainingClassListSortBy): "asc" | "desc" {
    switch (column) {
        case "title":
        case "description":
        case "sport":
            return "asc"
        case "difficulty":
        case "exerciseCount":
        case "totalMinutes":
        case "isPublic":
        case "updatedAt":
        case "createdAt":
        default:
            return "desc"
    }
}

export function ClassesPaginatedTable({
    classes,
    totalPages,
    sports,
    listState,
}: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [, startTransition] = useTransition()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            sport: listState.sport,
            difficulty: listState.difficulty,
            visibility: listState.visibility,
        },
    })
    const [optimisticClasses, removeClassOptimistic] = useOptimistic(
        classes,
        (current, deletedId: string) => current.filter((c) => c.id !== deletedId),
    )

    const deleteClass = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    removeClassOptimistic(id)
                    const result = await deleteTrainingClassAction(id)
                    if (result.ok) {
                        router.refresh()
                        resolve({ ok: true })
                    } else {
                        toast({
                            type: "error",
                            title: "No se pudo eliminar la clase",
                            message: result.error,
                        })
                        router.refresh()
                        resolve({ ok: false, error: result.error })
                    }
                })
            }),
        [removeClassOptimistic, router, toast],
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
        router.push(`/classes/list?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-wrap items-center justify-start gap-3"
            >
                <input
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por título"
                    className="min-w-32 flex-1 rounded border border-zinc-300 bg-white p-0.5 dark:border-zinc-600 dark:bg-zinc-700 sm:max-w-xs"
                />
                <select
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
                    {...register("visibility")}
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="">Todas</option>
                    <option value="public">Públicas</option>
                    <option value="private">Privadas</option>
                </select>
                <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                    Buscar
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="app-scrollbar overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <SortableTh
                                    column="title"
                                    label="Título"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("title")}
                                />
                                <SortableTh
                                    column="description"
                                    label="Descripción"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("description")}
                                />
                                <SortableTh
                                    column="sport"
                                    label="Deporte"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("sport")}
                                />
                                <SortableTh
                                    column="difficulty"
                                    label="Dificultad"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("difficulty")}
                                />
                                <SortableTh
                                    column="exerciseCount"
                                    label="Ejercicios"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("exerciseCount")}
                                />
                                <SortableTh
                                    column="totalMinutes"
                                    label="Duración"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("totalMinutes")}
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
                            {optimisticClasses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay clases con estos filtros.{" "}
                                        <Link
                                            href="/classes/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear la primera
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                optimisticClasses.map((trainingClass) => (
                                    <tr
                                        key={trainingClass.id}
                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                    >
                                        <td className="max-w-xs px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            <span className="line-clamp-2">
                                                {trainingClass.title}
                                            </span>
                                        </td>
                                        <td className="max-w-md px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            {trainingClass.description?.trim() ? (
                                                <span className="line-clamp-2">
                                                    {trainingClass.description.trim()}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400 dark:text-zinc-500">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.sport?.name ?? "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.difficulty} / 5
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.exerciseCount}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.totalMinutes} min
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.isPublic ? "Pública" : "Privada"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            {new Intl.DateTimeFormat("es", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            }).format(new Date(trainingClass.updatedAt))}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <ClassRowActions
                                                id={trainingClass.id}
                                                title={trainingClass.title}
                                                deleteClass={deleteClass}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination totalPages={totalPages} />
        </div>
    )
}
