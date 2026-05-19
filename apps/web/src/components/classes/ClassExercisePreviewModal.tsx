"use client"

import { useEffect, useMemo, useState } from "react"
import { IoCloseOutline } from "react-icons/io5"

import { getExerciseCanvasAction } from "@/app/actions/exercises"
import { ExerciseOrderPanel } from "@/components/exercise-canvas/ExerciseOrderPanel"
import type { ExerciseCanvas } from "@/interfaces"
import {
    buildOrderedItemsFromCanvas,
    playerOptionsFromCanvas,
} from "@/utils/exercise-ordered-items"

type Props = {
    open: boolean
    onClose: () => void
    exercise: {
        id: string
        title: string
        previewUrl: string
    } | null
}

export function ClassExercisePreviewModal({ open, onClose, exercise }: Props) {
    const [canvas, setCanvas] = useState<ExerciseCanvas | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [playerFilter, setPlayerFilter] = useState("all")

    useEffect(() => {
        if (!open || !exercise) {
            setCanvas(null)
            setError(null)
            setPlayerFilter("all")
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        void getExerciseCanvasAction({ id: exercise.id }).then((result) => {
            if (cancelled) return
            setLoading(false)
            if (!result.ok) {
                setError(result.error)
                setCanvas(null)
                return
            }
            setCanvas(result.data)
        })

        return () => {
            cancelled = true
        }
    }, [open, exercise?.id])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", onKeyDown)
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = prev
        }
    }, [open, onClose])

    const orderedItems = useMemo(
        () => (canvas ? buildOrderedItemsFromCanvas(canvas, playerFilter) : []),
        [canvas, playerFilter],
    )

    const playerOptions = useMemo(
        () => (canvas ? playerOptionsFromCanvas(canvas) : []),
        [canvas],
    )

    if (!open || !exercise) return null

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <PreviewDialog
                exercise={exercise}
                loading={loading}
                error={error}
                orderedItems={orderedItems}
                playerOptions={playerOptions}
                playerFilter={playerFilter}
                setPlayerFilter={setPlayerFilter}
                onClose={onClose}
            />
        </div>
    )
}

function PreviewDialog({
    exercise,
    loading,
    error,
    orderedItems,
    playerOptions,
    playerFilter,
    setPlayerFilter,
    onClose,
}: {
    exercise: NonNullable<Props["exercise"]>
    loading: boolean
    error: string | null
    orderedItems: ReturnType<typeof buildOrderedItemsFromCanvas>
    playerOptions: string[]
    playerFilter: string
    setPlayerFilter: (v: string) => void
    onClose: () => void
}) {
    return (
        <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-exercise-preview-title"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
                <h2
                    id="class-exercise-preview-title"
                    className="text-lg font-semibold text-zinc-900 dark:text-white"
                >
                    {exercise.title}
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

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 lg:flex-row lg:items-start">
                <div className="shrink-0 lg:w-[min(100%,420px)]">
                    <img
                        src={exercise.previewUrl}
                        alt={`Vista del ejercicio ${exercise.title}`}
                        className="w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    {loading ? (
                        <p className="text-sm text-zinc-500">Cargando pasos del ejercicio…</p>
                    ) : error ? (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    ) : (
                        <ExerciseOrderPanel
                            readOnly
                            title="Orden del ejercicio"
                            className="w-full"
                            orderedItems={orderedItems}
                            playerOptions={playerOptions}
                            playerFilter={playerFilter}
                            setPlayerFilter={setPlayerFilter}
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-end border-t border-zinc-200 px-5 py-3 dark:border-zinc-700">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
                >
                    Cerrar
                </button>
            </div>
        </div>
    )
}
