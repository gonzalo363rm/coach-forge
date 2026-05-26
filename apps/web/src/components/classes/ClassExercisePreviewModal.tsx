"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
    IoCloseOutline,
    IoContractOutline,
    IoExpandOutline,
} from "react-icons/io5"

import { getExerciseCanvasAction } from "@/app/actions/exercises"
import { ExerciseOrderPanel } from "@/components/exercise-canvas/ExerciseOrderPanel"
import type { ExerciseCanvas } from "@/interfaces"
import {
    buildOrderedItemsFromCanvas,
    playerOptionsFromCanvas,
} from "@/utils/exercise-ordered-items"

const PREVIEW_PLACEHOLDER = "/exercises/placeholder-preview.svg"

type ExercisePreview = {
    id: string
    title: string
    previewUrl: string
}

type Props = {
    open: boolean
    onClose: () => void
    exercise: ExercisePreview | null
}

export function ClassExercisePreviewModal({ open, onClose, exercise }: Props) {
    const [expanded, setExpanded] = useState(false)
    const [canvas, setCanvas] = useState<ExerciseCanvas | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [playerFilter, setPlayerFilter] = useState("all")

    useEffect(() => {
        if (!open || !exercise) {
            setCanvas(null)
            setError(null)
            setPlayerFilter("all")
            setExpanded(false)
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
            if (e.key !== "Escape") return
            if (expanded) {
                setExpanded(false)
                return
            }
            onClose()
        }
        document.addEventListener("keydown", onKeyDown)
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = prev
        }
    }, [open, onClose, expanded])

    const orderedItems = useMemo(
        () => (canvas ? buildOrderedItemsFromCanvas(canvas, playerFilter) : []),
        [canvas, playerFilter],
    )

    const playerOptions = useMemo(
        () => (canvas ? playerOptionsFromCanvas(canvas) : []),
        [canvas],
    )

    if (!open || !exercise) return null

    const contentProps = {
        exercise,
        loading,
        error,
        orderedItems,
        playerOptions,
        playerFilter,
        setPlayerFilter,
        expanded,
        onToggleExpand: () => setExpanded((v) => !v),
        onClose,
    }

    if (expanded) {
        return (
            <div
                className="fixed inset-0 z-70 flex flex-col bg-zinc-950"
                role="dialog"
                aria-modal="true"
                aria-labelledby="class-exercise-preview-title"
            >
                <ExercisePreviewContent {...contentProps} layout="fullscreen" />
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                role="dialog"
                aria-modal="true"
                aria-labelledby="class-exercise-preview-title"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <ExercisePreviewContent {...contentProps} layout="modal" />
            </div>
        </div>
    )
}

function ExercisePreviewContent({
    exercise,
    loading,
    error,
    orderedItems,
    playerOptions,
    playerFilter,
    setPlayerFilter,
    expanded,
    onToggleExpand,
    onClose,
    layout,
}: {
    exercise: ExercisePreview
    loading: boolean
    error: string | null
    orderedItems: ReturnType<typeof buildOrderedItemsFromCanvas>
    playerOptions: string[]
    playerFilter: string
    setPlayerFilter: (v: string) => void
    expanded: boolean
    onToggleExpand: () => void
    onClose: () => void
    layout: "modal" | "fullscreen"
}) {
    const isFullscreen = layout === "fullscreen"
    const [previewSrc, setPreviewSrc] = useState(exercise.previewUrl)

    useEffect(() => {
        setPreviewSrc(exercise.previewUrl)
    }, [exercise.previewUrl])

    return (
        <>
            <div
                className={`flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700 ${
                    isFullscreen ? "border-zinc-800 bg-zinc-950" : ""
                }`}
            >
                <h2
                    id="class-exercise-preview-title"
                    className={`font-semibold text-zinc-900 dark:text-white ${
                        isFullscreen ? "text-xl" : "text-lg"
                    }`}
                >
                    {exercise.title}
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={onToggleExpand}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label={expanded ? "Salir de pantalla completa" : "Pantalla completa"}
                        title={expanded ? "Contraer" : "Expandir"}
                    >
                        {expanded ? (
                            <IoContractOutline className="h-6 w-6" />
                        ) : (
                            <IoExpandOutline className="h-6 w-6" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Cerrar"
                    >
                        <IoCloseOutline className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <div
                className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 ${
                    isFullscreen
                        ? "lg:flex-row lg:items-stretch lg:gap-8 lg:p-8"
                        : "lg:flex-row lg:items-start"
                }`}
            >
                <div
                    className={
                        isFullscreen
                            ? "relative flex min-h-0 w-full flex-1 items-center justify-center lg:min-h-[60vh]"
                            : "relative w-full shrink-0 lg:w-[min(100%,420px)]"
                    }
                >
                    <div
                        className={`relative w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 ${
                            isFullscreen
                                ? "h-[min(70vh,900px)]"
                                : "aspect-4/3 min-h-[200px]"
                        }`}
                    >
                        <Image
                            src={previewSrc}
                            alt={`Vista del ejercicio ${exercise.title}`}
                            fill
                            sizes={
                                isFullscreen
                                    ? "(max-width: 1024px) 100vw, 70vw"
                                    : "(max-width: 1024px) 100vw, 420px"
                            }
                            unoptimized={previewSrc.endsWith(".svg")}
                            className="object-contain"
                            onError={() => setPreviewSrc(PREVIEW_PLACEHOLDER)}
                        />
                    </div>
                </div>
                <div
                    className={`min-w-0 flex-1 ${isFullscreen ? "lg:max-w-md lg:overflow-y-auto" : ""}`}
                >
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

            {!isFullscreen ? (
                <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-700">
                    <button
                        type="button"
                        onClick={onToggleExpand}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
                    >
                        Pantalla completa
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
                    >
                        Cerrar
                    </button>
                </div>
            ) : null}
        </>
    )
}
