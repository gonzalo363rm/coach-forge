"use client"

import { useCallback, useEffect, useState } from "react"

import type { Exercise, ExerciseCanvas } from "@/interfaces"

export type SaveExerciseModalProps = {
    open: boolean
    canvas: ExerciseCanvas
    onClose: () => void
    /** Si no se pasa, solo se simula un guardado y se cierra el modal. */
    onSave?: (exercise: Exercise) => void | Promise<void>
}

const DIFFICULTY_ACTIVE_CLASS: Record<number, string> = {
    1: "cf-diff-segment-active-1",
    2: "cf-diff-segment-active-2",
    3: "cf-diff-segment-active-3",
    4: "cf-diff-segment-active-4",
    5: "cf-diff-segment-active-5",
}

export const SaveExerciseModal = ({ open, canvas, onClose, onSave }: SaveExerciseModalProps) => {
    const [title, setTitle] = useState("")
    const [categories, setCategories] = useState<string[]>([])
    const [categoryDraft, setCategoryDraft] = useState("")
    const [minPlayers, setMinPlayers] = useState("")
    const [maxPlayers, setMaxPlayers] = useState("")
    const [difficulty, setDifficulty] = useState(3)
    const [videoLink, setVideoLink] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setTitle("")
        setCategories([])
        setCategoryDraft("")
        setMinPlayers("")
        setMaxPlayers("")
        setDifficulty(3)
        setVideoLink("")
    }, [open])

    const commitCategory = useCallback(() => {
        const next = categoryDraft.trim()
        if (!next) return
        if (categories.includes(next)) {
            setCategoryDraft("")
            return
        }
        setCategories((prev) => [...prev, next])
        setCategoryDraft("")
    }, [categoryDraft, categories])

    const removeCategory = useCallback((value: string) => {
        setCategories((prev) => prev.filter((c) => c !== value))
    }, [])

    const buildExercise = useCallback((): Exercise => {
        const minParsed = minPlayers.trim() === "" ? null : Number(minPlayers)
        const maxParsed = maxPlayers.trim() === "" ? null : Number(maxPlayers)
        return {
            title: title.trim(),
            categories,
            minPlayers: Number.isFinite(minParsed) ? minParsed : null,
            maxPlayers: Number.isFinite(maxParsed) ? maxParsed : null,
            difficulty,
            videoLink: videoLink.trim(),
            canvas,
        }
    }, [title, categories, minPlayers, maxPlayers, difficulty, videoLink, canvas])

    const handleConfirm = useCallback(async () => {
        setIsSaving(true)
        try {
            const exercise = buildExercise()
            if (onSave) await onSave(exercise)
            else await new Promise((r) => setTimeout(r, 700))
            onClose()
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
                        <span>Titulo</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="cf-modal-input"
                        />
                    </label>
                    <div className="cf-modal-label flex flex-col gap-2 sm:col-span-2">
                        <span>Categorias</span>
                        <div className="flex gap-1.5">
                            <input
                                type="text"
                                value={categoryDraft}
                                onChange={(e) => setCategoryDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        commitCategory()
                                    }
                                }}
                                placeholder="Escribe y Enter o añade con +"
                                className="cf-modal-input min-w-0 flex-1"
                            />
                            <button
                                type="button"
                                aria-label="Añadir categoria"
                                onClick={commitCategory}
                                className="cf-btn-add-category"
                            >
                                +
                            </button>
                        </div>
                        {categories.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5" aria-label="Categorias seleccionadas">
                                {categories.map((tag) => (
                                    <li key={tag}>
                                        <span className="cf-category-chip">
                                            {tag}
                                            <button
                                                type="button"
                                                aria-label={`Quitar ${tag}`}
                                                onClick={() => removeCategory(tag)}
                                                className="cf-category-chip-remove"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button type="button" disabled={isSaving} onClick={onClose} className="cf-btn-neutral">
                        Cancelar
                    </button>
                    <button type="button" disabled={isSaving} onClick={handleConfirm} className="cf-btn-success">
                        {isSaving ? "Guardando..." : "Aceptar"}
                    </button>
                </div>
            </div>
        </div>
    )
}
