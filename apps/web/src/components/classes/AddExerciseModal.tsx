"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { IoChevronBackOutline, IoChevronForwardOutline, IoCloseOutline } from "react-icons/io5"

import { getExercisesPaginatedAction } from "@/app/actions/exercises"
import { ExercisePreviewThumb } from "@/components/exercises/ExercisePreviewThumb"
import { Button } from "@/components/ui/button"
import type { ExerciseListItem } from "@/services/exercises.service"
import type { Sport } from "@prisma/client"

import { ClassExerciseConfigModal } from "./ClassExerciseConfigModal"
import { DifficultyRangeFilter } from "./DifficultyRangeFilter"

type Props = {
    open: boolean
    onClose: () => void
    sports: Sport[]
    excludeExerciseIds: string[]
    onAdd: (
        exercise: ExerciseListItem,
        config: { durationMinutes: number | null; isOptional: boolean },
    ) => void
}

type FilterForm = {
    search: string
    sport: string
    filterMinPlayers: string
    filterMaxPlayers: string
}

const filterInputClass =
    "rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"

function formatPlayerRange(min: number | null, max: number | null): string {
    if (min == null && max == null) return "—"
    if (min != null && max != null) {
        return min === max ? String(min) : `${min}–${max}`
    }
    if (min != null) return `≥ ${min}`
    return `≤ ${max}`
}

export function AddExerciseModal({
    open,
    onClose,
    sports,
    excludeExerciseIds,
    onAdd,
}: Props) {
    const [exercises, setExercises] = useState<ExerciseListItem[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(1)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const [configureExercise, setConfigureExercise] = useState<ExerciseListItem | null>(null)
    const [difficultyMin, setDifficultyMin] = useState(1)
    const [difficultyMax, setDifficultyMax] = useState(5)

    const { register, handleSubmit, getValues } = useForm<FilterForm>({
        defaultValues: {
            search: "",
            sport: "",
            filterMinPlayers: "",
            filterMaxPlayers: "",
        },
    })

    const fetchExercises = useCallback(
        (
            targetPage: number,
            difficultyOverride?: { min: number; max: number },
        ) => {
            const data = getValues()
            const dMin = difficultyOverride?.min ?? difficultyMin
            const dMax = difficultyOverride?.max ?? difficultyMax
            startTransition(async () => {
                setError(null)
                const result = await getExercisesPaginatedAction({
                    page: targetPage,
                    take: 8,
                    filters: {
                        search: data.search?.trim() || null,
                        sport: data.sport || null,
                        filterMinPlayers: data.filterMinPlayers
                            ? Number(data.filterMinPlayers)
                            : undefined,
                        filterMaxPlayers: data.filterMaxPlayers
                            ? Number(data.filterMaxPlayers)
                            : undefined,
                        difficultyMin: dMin,
                        difficultyMax: dMax,
                    },
                    sortBy: "title",
                    sortDir: "asc",
                })
                if (!result.ok) {
                    setError(result.error)
                    return
                }
                setExercises(result.data.exercises)
                setTotalPages(result.data.totalPages)
                setPage(result.data.currentPage)
            })
        },
        [difficultyMin, difficultyMax, getValues],
    )

    useEffect(() => {
        if (!open) return
        setDifficultyMin(1)
        setDifficultyMax(5)
        setPage(1)
        setError(null)
        const data = getValues()
        startTransition(async () => {
            const result = await getExercisesPaginatedAction({
                page: 1,
                take: 8,
                filters: {
                    search: data.search?.trim() || null,
                    sport: data.sport || null,
                    filterMinPlayers: data.filterMinPlayers
                        ? Number(data.filterMinPlayers)
                        : undefined,
                    filterMaxPlayers: data.filterMaxPlayers
                        ? Number(data.filterMaxPlayers)
                        : undefined,
                    difficultyMin: 1,
                    difficultyMax: 5,
                },
                sortBy: "title",
                sortDir: "asc",
            })
            if (!result.ok) {
                setError(result.error)
                return
            }
            setExercises(result.data.exercises)
            setTotalPages(result.data.totalPages)
            setPage(result.data.currentPage)
        })
        // Solo al abrir el modal; no depender de fetchExercises (cambia al mover el slider).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    if (!open) return null

    const excluded = new Set(excludeExerciseIds)

    return (
        <>
            <ModalShell onClose={onClose}>
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
                    <h2
                        id="add-exercise-modal-title"
                        className="text-lg font-semibold text-zinc-900 dark:text-white"
                    >
                        Añadir ejercicio a la clase
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Cerrar"
                    >
                        <IoCloseOutline className="h-6 w-6" />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-4">
                    {/* <div className="mb-4 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/40"> */}
                    <form
                        onSubmit={handleSubmit(() => fetchExercises(1))}
                        className="flex flex-col gap-3 mb-4"
                    >
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Buscar
                                </span>
                                <input
                                    {...register("search")}
                                    type="text"
                                    placeholder="Título del ejercicio"
                                    className={filterInputClass}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Deporte
                                </span>
                                <select {...register("sport")} className={filterInputClass}>
                                    <option value="">Todos</option>
                                    {sports.map((s) => (
                                        <option key={s.id} value={s.slug}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex w-28 flex-col gap-1">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Mín. jugadores
                                </span>
                                <input
                                    {...register("filterMinPlayers")}
                                    type="number"
                                    min={1}
                                    placeholder="—"
                                    className={filterInputClass}
                                />
                            </label>
                            <label className="flex w-28 flex-col gap-1">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Máx. jugadores
                                </span>
                                <input
                                    {...register("filterMaxPlayers")}
                                    type="number"
                                    min={1}
                                    placeholder="—"
                                    className={filterInputClass}
                                />
                            </label>
                            <DifficultyRangeFilter
                                min={difficultyMin}
                                max={difficultyMax}
                                onChange={(min, max) => {
                                    setDifficultyMin(min)
                                    setDifficultyMax(max)
                                }}
                                className="max-w-xs sm:max-w-sm"
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                className="shrink-0"
                                disabled={pending}
                            >
                                Buscar
                            </Button>
                        </div>
                    </form>
                    {/* </div> */}

                    {error ? (
                        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                    ) : null}

                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/80">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-zinc-500">
                                        Vista
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-zinc-500">
                                        Título
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-zinc-500">
                                        Jug.
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-zinc-500">
                                        Dif.
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-zinc-500">
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                                {pending && exercises.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-3 py-8 text-center text-sm text-zinc-500"
                                        >
                                            Cargando…
                                        </td>
                                    </tr>
                                ) : exercises.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-3 py-8 text-center text-sm text-zinc-500"
                                        >
                                            No hay ejercicios con estos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    exercises.map((exercise) => {
                                        const already = excluded.has(exercise.id)
                                        return (
                                            <tr
                                                key={exercise.id}
                                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            >
                                                <td className="px-3 py-2">
                                                    <ExercisePreviewThumb
                                                        previewUrl={exercise.previewUrl}
                                                        title={exercise.title}
                                                    />
                                                </td>
                                                <td className="max-w-xs px-3 py-2 text-sm font-medium">
                                                    {exercise.title}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                                                    {formatPlayerRange(
                                                        exercise.minPlayers,
                                                        exercise.maxPlayers,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-sm tabular-nums">
                                                    {exercise.difficulty}/5
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        size="sm"
                                                        disabled={already}
                                                        onClick={() =>
                                                            setConfigureExercise(exercise)
                                                        }
                                                    >
                                                        {already ? "En la clase" : "Añadir"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 ? (
                        <div className="mt-4 flex items-center justify-center gap-4">
                            <button
                                type="button"
                                disabled={page <= 1 || pending}
                                onClick={() => fetchExercises(page - 1)}
                                className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                aria-label="Página anterior"
                            >
                                <IoChevronBackOutline size={24} />
                            </button>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages || pending}
                                onClick={() => fetchExercises(page + 1)}
                                className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                aria-label="Página siguiente"
                            >
                                <IoChevronForwardOutline size={24} />
                            </button>
                        </div>
                    ) : null}
                </div>
            </ModalShell>

            <ClassExerciseConfigModal
                mode="add"
                open={configureExercise != null}
                exercise={configureExercise}
                onClose={() => setConfigureExercise(null)}
                onConfirm={(config) => {
                    if (!configureExercise) return
                    onAdd(configureExercise, config)
                    setConfigureExercise(null)
                }}
            />
        </>
    )
}

function ModalShell({
    children,
    onClose,
}: {
    children: React.ReactNode
    onClose: () => void
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-exercise-modal-title"
                onPointerDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}
