"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { Exercise, ExerciseCanvas, SportListOption } from "@/interfaces"
import { EXERCISE_EMPTY_CANVAS_MESSAGE } from "@/schemas/exercise.schema"

export type SaveExerciseModalFieldDefaults = {
    title: string
    minPlayers: number | null
    maxPlayers: number | null
    difficulty: number
    isPublic: boolean
    videoLink: string | null
    sportId: string | null
}

export type SaveExerciseModalProps = {
    open: boolean
    canvas: ExerciseCanvas
    onClose: () => void
    /** Si no se pasa, solo se simula un guardado y se cierra el modal. */
    onSave?: (exercise: Exercise) => void | Promise<void>
    /** Al editar: valores iniciales del formulario al abrir el modal. */
    fieldDefaults?: SaveExerciseModalFieldDefaults | null
    /** Deportes disponibles (ordenados por nombre en el servidor). */
    sports?: SportListOption[]
}

const DIFFICULTY_ACTIVE_CLASS: Record<number, string> = {
    1: "cf-diff-segment-active-1",
    2: "cf-diff-segment-active-2",
    3: "cf-diff-segment-active-3",
    4: "cf-diff-segment-active-4",
    5: "cf-diff-segment-active-5",
}

export const SaveExerciseModal = ({
    open,
    canvas,
    onClose,
    onSave,
    fieldDefaults,
    sports = [],
}: SaveExerciseModalProps) => {
    const [title, setTitle] = useState("")
    const [minPlayers, setMinPlayers] = useState("")
    const [maxPlayers, setMaxPlayers] = useState("")
    const [difficulty, setDifficulty] = useState(3)
    const [videoLink, setVideoLink] = useState("")
    const [sportId, setSportId] = useState<string | null>(null)
    const [isPublic, setIsPublic] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const sportIds = useMemo(() => new Set(sports.map((s) => s.id)), [sports])
    const sportOrphan = sportId != null && !sportIds.has(sportId)

    useEffect(() => {
        if (!open) return
        if (fieldDefaults) {
            setTitle(fieldDefaults.title)
            setMinPlayers(fieldDefaults.minPlayers != null ? String(fieldDefaults.minPlayers) : "")
            setMaxPlayers(fieldDefaults.maxPlayers != null ? String(fieldDefaults.maxPlayers) : "")
            setDifficulty(fieldDefaults.difficulty)
            setIsPublic(fieldDefaults.isPublic)
            setVideoLink(fieldDefaults.videoLink ?? "")
            setSportId(fieldDefaults.sportId)
        } else {
            setTitle("")
            setMinPlayers("")
            setMaxPlayers("")
            setDifficulty(3)
            setIsPublic(false)
            setVideoLink("")
            setSportId(null)
        }
    }, [open, fieldDefaults])

    const buildExercise = useCallback((): Exercise => {
        const minParsed = minPlayers.trim() === "" ? null : Number(minPlayers)
        const maxParsed = maxPlayers.trim() === "" ? null : Number(maxPlayers)
        return {
            sportId,
            title: title.trim(),
            minPlayers: Number.isFinite(minParsed) ? minParsed : null,
            maxPlayers: Number.isFinite(maxParsed) ? maxParsed : null,
            difficulty,
            isPublic,
            videoLink: videoLink.trim() === "" ? null : videoLink.trim(),
            canvas,
        }
    }, [sportId, title, minPlayers, maxPlayers, difficulty, isPublic, videoLink, canvas])

    const handleConfirm = useCallback(async () => {
        setIsSaving(true)
        try {
            const exercise = buildExercise()
            const c = exercise.canvas
            const elementCount =
                c.images.length +
                c.circles.length +
                c.rects.length +
                c.lines.length +
                c.arrows.length
            if (elementCount === 0) {
                window.alert(EXERCISE_EMPTY_CANVAS_MESSAGE)
                return
            }
            if (onSave) await onSave(exercise)
            else await new Promise((r) => setTimeout(r, 700))
            onClose()
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Error al guardar"
            window.alert(msg)
        } finally {
            setIsSaving(false)
        }
    }, [buildExercise, onClose, onSave])

    if (!open) return null

    return (
        <div
            className="cf-modal-backdrop"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="cf-modal-card cf-modal-card--lg"
                role="dialog"
                aria-modal="true"
                aria-labelledby="save-modal-title"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <h3 id="save-modal-title" className="cf-modal-title">
                    Guardar ejercicio
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="cf-modal-label flex flex-col gap-1 sm:col-span-2">
                        <span>Deporte</span>
                        <select
                            value={sportId ?? ""}
                            onChange={(e) => setSportId(e.target.value === "" ? null : e.target.value)}
                            aria-describedby="save-modal-sport-hint"
                            className="cf-modal-input"
                        >
                            <option value="">Sin deporte</option>
                            {sportOrphan ? (
                                <option value={sportId!}>Deporte eliminado (referencia guardada)</option>
                            ) : null}
                            {sports.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <span id="save-modal-sport-hint" className="cf-modal-text text-xs">
                            {sports.length === 0
                                ? "No hay deportes en el sistema; puedes dejar «Sin deporte» o crearlos antes."
                                : "Elige el deporte al que aplica el ejercicio, o déjalo genérico."}
                        </span>
                    </label>
                    <label className="cf-modal-label flex flex-col gap-1 sm:col-span-2">
                        <span>Titulo</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="cf-modal-input"
                        />
                    </label>
                    <label className="cf-modal-label flex flex-col gap-1">
                        <span>Min jugadores</span>
                        <input
                            type="number"
                            min={1}
                            value={minPlayers}
                            onChange={(e) => setMinPlayers(e.target.value)}
                            className="cf-modal-input"
                        />
                    </label>
                    <label className="cf-modal-label flex flex-col gap-1">
                        <span>Max jugadores</span>
                        <input
                            type="number"
                            min={1}
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(e.target.value)}
                            className="cf-modal-input"
                        />
                    </label>
                    <fieldset className="cf-modal-label flex flex-col gap-1">
                        <legend>Dificultad</legend>
                        <div className="cf-diff-row">
                            {[1, 2, 3, 4, 5].map((level) => {
                                const isActive = difficulty === level
                                const activeClass = DIFFICULTY_ACTIVE_CLASS[level] ?? "cf-diff-segment-active-3"

                                return (
                                    <label key={level} className="cf-diff-label-split">
                                        <input
                                            type="radio"
                                            name="save-difficulty"
                                            value={level}
                                            checked={isActive}
                                            onChange={() => setDifficulty(level)}
                                            className="sr-only"
                                        />
                                        <span
                                            className={`cf-diff-segment ${isActive ? activeClass : "cf-diff-segment-idle"}`}
                                        >
                                            {level}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>
                    </fieldset>
                    <label className="cf-modal-label flex flex-col gap-1">
                        <span>Link video</span>
                        <input
                            type="url"
                            value={videoLink}
                            onChange={(e) => setVideoLink(e.target.value)}
                            placeholder="https://..."
                            className="cf-modal-input"
                        />
                    </label>
                    <div className="flex items-center justify-between gap-3 sm:col-span-2">
                        <span className="cf-modal-label text-sm">Ejercicio público</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isPublic}
                            onClick={() => setIsPublic((value) => !value)}
                            className={`relative h-5 w-10 shrink-0 overflow-hidden rounded-full transition-colors ${
                                isPublic
                                    ? "bg-emerald-500"
                                    : "bg-zinc-400 dark:bg-zinc-600"
                            }`}
                        >
                            <span
                                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    isPublic ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:col-span-2">
                        {isPublic
                            ? "Visible para todos."
                            : "Solo tú podrás verlo."}
                    </p>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isSaving}
                        onClick={handleConfirm}
                    >
                        {isSaving ? "Guardando..." : "Aceptar"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
