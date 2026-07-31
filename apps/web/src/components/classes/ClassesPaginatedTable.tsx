"use client"

import { deleteTrainingClassAction } from "@/app/actions/classes"
import { ClassRowActions } from "@/components/classes/ClassRowActions"
import { CreatorSelect } from "@/components/users/CreatorSelect"
import { formatUserDisplayName } from "@/lib/user-display"
import { formatContentVisibility } from "@/lib/content-visibility"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
    listFilterSelectClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import { useToast } from "@/hooks/use-toast"
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
    listBasePath?: string
    showCreatorFilter?: boolean
    hideClassMetrics?: boolean
    initialCreatorLabel?: string | null
    listState: {
        search: string
        sport: string
        difficulty: string
        visibility: string
        creator: string
        sortBy: TrainingClassListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    sport: string
    difficulty: string
    visibility: string
    creator: string
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
        case "visibility":
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
    listBasePath = "/admin/classes",
    showCreatorFilter = false,
    hideClassMetrics = false,
    initialCreatorLabel = null,
    listState,
}: Props) {
    const columnCount =
        7 + (showCreatorFilter ? 1 : 0) + (hideClassMetrics ? 0 : 2)
    const router = useRouter()
    const { toast } = useToast()
    const [, startTransition] = useTransition()
    const { register, handleSubmit, setValue, watch } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            sport: listState.sport,
            difficulty: listState.difficulty,
            visibility: listState.visibility,
            creator: listState.creator,
        },
    })
    const creator = watch("creator")
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
        if (data.creator) p.set("creator", data.creator)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`${listBasePath}?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por título"
                    className={listFilterSearchClass}
                />
                <select {...register("sport")} className={listFilterSelectClass}>
                    <option value="">Todos los deportes</option>
                    {sports.map((sport) => (
                        <option key={sport.id} value={sport.slug}>
                            {sport.name}
                        </option>
                    ))}
                </select>
                <select {...register("difficulty")} className={listFilterSelectClass}>
                    <option value="">Todas las dificultades</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={String(n)}>
                            {n} / 5
                        </option>
                    ))}
                </select>
                <select {...register("visibility")} className={listFilterSelectClass}>
                    <option value="">Todas</option>
                    <option value="club">Club</option>
                    <option value="public">Públicas</option>
                    <option value="private">Privadas</option>
                </select>
                {showCreatorFilter ? (
                    <CreatorSelect
                        value={creator}
                        initialLabel={initialCreatorLabel}
                        onChange={(id) => setValue("creator", id)}
                    />
                ) : null}
                <button type="submit" className={listFilterButtonClass}>
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
                                {showCreatorFilter ? (
                                    <th
                                        scope="col"
                                        className={tableHeaderThClass}
                                    >
                                        Creador
                                    </th>
                                ) : null}
                                <SortableTh
                                    column="difficulty"
                                    label="Dificultad"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("difficulty")}
                                />
                                {!hideClassMetrics ? (
                                    <>
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
                                    </>
                                ) : null}
                                <SortableTh
                                    column="visibility"
                                    label="Visibilidad"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("visibility")}
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
                                    className={tableHeaderThClass}
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticClasses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columnCount}
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
                                        <td className="max-w-xs px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            <span className="line-clamp-2">
                                                {trainingClass.title}
                                            </span>
                                        </td>
                                        <td className="max-w-md px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
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
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.sport?.name ?? "—"}
                                        </td>
                                        {showCreatorFilter ? (
                                            <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                {trainingClass.creator
                                                    ? formatUserDisplayName(trainingClass.creator)
                                                    : "—"}
                                            </td>
                                        ) : null}
                                        <td className="whitespace-nowrap px-4 py-2 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                            {trainingClass.difficulty} / 5
                                        </td>
                                        {!hideClassMetrics ? (
                                            <>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                                    {trainingClass.exerciseCount}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-2 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                                    {trainingClass.totalMinutes} min
                                                </td>
                                            </>
                                        ) : null}
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatContentVisibility(trainingClass.visibility)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            {new Intl.DateTimeFormat("es", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            }).format(new Date(trainingClass.updatedAt))}
                                        </td>
                                        <td className="px-4 py-2 align-top">
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
