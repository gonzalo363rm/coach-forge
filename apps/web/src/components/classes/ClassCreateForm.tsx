"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import {
    createTrainingClassAction,
    getExerciseSummaryAction,
    updateTrainingClassAction,
} from "@/app/actions/classes"
import {
    computeExerciseCount,
    computeTotalMinutes,
} from "@/schemas/training-class.schema"
import type { Sport } from "@prisma/client"

import { AddExerciseModal } from "./AddExerciseModal"
import { ClassExerciseList } from "./ClassExerciseList"
import {
    defaultClassDraft,
    exerciseToDraftItem,
    loadClassDraft,
    saveClassDraft,
    clearClassDraft,
    type ClassDraft,
    type ClassDraftExerciseItem,
} from "./class-draft-storage"
import { ClassExerciseConfigModal } from "./ClassExerciseConfigModal"
import { ClassExercisePreviewModal } from "./ClassExercisePreviewModal"
import type { ExerciseListItem } from "@/services/exercises.service"

type Props = {
    sports: Sport[]
    mode?: "create" | "edit"
    classId?: string
    initialDraft?: ClassDraft
}

export function ClassCreateForm({
    sports,
    mode = "create",
    classId,
    initialDraft,
}: Props) {
    const isEdit = mode === "edit"
    const router = useRouter()
    const searchParams = useSearchParams()
    const [draft, setDraft] = useState<ClassDraft>(defaultClassDraft)
    const [hydrated, setHydrated] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [viewItem, setViewItem] = useState<ClassDraftExerciseItem | null>(null)
    const [editItem, setEditItem] = useState<ClassDraftExerciseItem | null>(null)

    useEffect(() => {
        if (isEdit && initialDraft) {
            setDraft(initialDraft)
        } else {
            const stored = loadClassDraft()
            setDraft(stored ?? defaultClassDraft())
        }
        setHydrated(true)
    }, [isEdit, initialDraft])

    useEffect(() => {
        if (!hydrated || isEdit) return
        saveClassDraft(draft)
    }, [draft, hydrated, isEdit])

    const applyAddedExercise = useCallback(async (exerciseId: string) => {
        const result = await getExerciseSummaryAction({ id: exerciseId })
        if (!result.ok) return
        setDraft((prev) => {
            if (prev.items.some((i) => i.exerciseId === exerciseId)) return prev
            return {
                ...prev,
                items: [
                    ...prev.items,
                    exerciseToDraftItem(result.data, prev.items.length),
                ],
            }
        })
    }, [])

    useEffect(() => {
        if (!hydrated) return
        const addedId = searchParams.get("addedExerciseId")?.trim()
        if (!addedId) return
        const returnPath = isEdit && classId ? `/classes/${classId}/edit` : "/classes/new"
        void applyAddedExercise(addedId).then(() => {
            router.replace(returnPath)
        })
    }, [hydrated, searchParams, applyAddedExercise, router, isEdit, classId])

    const exerciseCount = useMemo(() => computeExerciseCount(draft.items), [draft.items])
    const totalMinutes = useMemo(() => computeTotalMinutes(draft.items), [draft.items])

    const returnToPath =
        isEdit && classId ? `/classes/${classId}/edit` : "/classes/new"
    const returnToEncoded = encodeURIComponent(returnToPath)

    const handleAddExercise = (
        exercise: ExerciseListItem,
        config: { durationMinutes: number | null; isOptional: boolean },
    ) => {
        setDraft((prev) => {
            if (prev.items.some((i) => i.exerciseId === exercise.id)) return prev
            return {
                ...prev,
                items: [
                    ...prev.items,
                    exerciseToDraftItem(exercise, prev.items.length, config),
                ],
            }
        })
        setAddModalOpen(false)
    }

    const handleSave = () => {
        setError(null)
        const description = draft.description.trim()
        const payload = {
            title: draft.title,
            description: description.length > 0 ? description : null,
            sportId: draft.sportId,
            difficulty: draft.difficulty,
            isPublic: draft.isPublic,
            items: draft.items.map((item, idx) => ({
                exerciseId: item.exerciseId,
                sortOrder: idx,
                durationMinutes: item.isOptional ? null : item.durationMinutes,
                isOptional: item.isOptional,
            })),
        }
        startTransition(async () => {
            const result = isEdit
                ? await updateTrainingClassAction({ id: classId!, ...payload })
                : await createTrainingClassAction(payload)
            if (!result.ok) {
                setError(result.error)
                return
            }
            if (!isEdit) clearClassDraft()
            router.push("/classes/mine")
            router.refresh()
        })
    }

    if (!hydrated) {
        return (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando borrador…</p>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <LayoutGrid>
                <aside className="flex flex-col gap-4">
                    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                            Datos de la clase
                        </h2>
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-zinc-600 dark:text-zinc-400">Título</span>
                                <input
                                    type="text"
                                    value={draft.title}
                                    onChange={(e) =>
                                        setDraft((p) => ({ ...p, title: e.target.value }))
                                    }
                                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
                                    placeholder="Ej. Entrenamiento drive"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-zinc-600 dark:text-zinc-400">Deporte</span>
                                <select
                                    value={draft.sportId ?? ""}
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            sportId: e.target.value === "" ? null : e.target.value,
                                        }))
                                    }
                                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
                                >
                                    <option value="">Sin deporte</option>
                                    {sports.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    Dificultad (1–5)
                                </span>
                                <select
                                    value={draft.difficulty}
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            difficulty: Number(e.target.value),
                                        }))
                                    }
                                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    Descripción
                                </span>
                                <textarea
                                    value={draft.description}
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={4}
                                    placeholder="Objetivos, notas para el equipo, etc. (opcional)"
                                    className="resize-y rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
                                />
                            </label>
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-zinc-700 dark:text-zinc-300">
                                    Clase pública
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={draft.isPublic}
                                    onClick={() =>
                                        setDraft((p) => ({ ...p, isPublic: !p.isPublic }))
                                    }
                                    className={`relative h-5 w-10 shrink-0 overflow-hidden rounded-full transition-colors ${
                                        draft.isPublic
                                            ? "bg-emerald-500"
                                            : "bg-zinc-400 dark:bg-zinc-600"
                                    }`}
                                >
                                    <span
                                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                            draft.isPublic ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {draft.isPublic
                                    ? "Visible para todos."
                                    : "Solo tú podrás verla."}
                            </p>
                        </div>
                    </section>
                    <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                        <p className="text-zinc-700 dark:text-zinc-300">
                            <span className="font-medium">{exerciseCount}</span> ejercicio{exerciseCount > 1 ? "s" : ""}
                        </p>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                            Duración total:{" "}
                            <span className="font-medium">{totalMinutes} min</span>
                        </p>
                    </section>
                </aside>

                <section className="flex min-w-0 flex-1 flex-col gap-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        Ejercicios de la clase
                    </h2>
                    <ClassExerciseList
                        items={draft.items}
                        returnTo={returnToPath}
                        onChange={(items) => setDraft((p) => ({ ...p, items }))}
                        onEdit={setEditItem}
                        onView={setViewItem}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => setAddModalOpen(true)}
                            className="flex-1 rounded-lg border border-dashed border-emerald-600 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        >
                            + Añadir ejercicio
                        </button>
                        <Link
                            href={`/exercises/new?returnTo=${returnToEncoded}`}
                            className="flex-1 rounded-lg border border-zinc-300 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            onClick={() => saveClassDraft(draft)}
                        >
                            + Nuevo ejercicio
                        </Link>
                    </div>
                </section>
            </LayoutGrid>

            {error ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <Link
                    href="/classes/mine"
                    className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
                >
                    Cancelar
                </Link>
                <button
                    type="button"
                    disabled={pending || draft.items.length === 0 || !draft.title.trim()}
                    onClick={handleSave}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                    {pending
                        ? "Guardando…"
                        : isEdit
                          ? "Guardar cambios"
                          : "Guardar clase"}
                </button>
            </div>

            <AddExerciseModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                sports={sports}
                excludeExerciseIds={draft.items.map((i) => i.exerciseId)}
                onAdd={handleAddExercise}
            />

            <ClassExercisePreviewModal
                open={viewItem != null}
                onClose={() => setViewItem(null)}
                exercise={
                    viewItem
                        ? {
                              id: viewItem.exerciseId,
                              title: viewItem.title,
                              previewUrl: viewItem.previewUrl,
                          }
                        : null
                }
            />

            <ClassExerciseConfigModal
                mode="edit"
                open={editItem != null}
                item={editItem}
                onClose={() => setEditItem(null)}
                onConfirm={(config) => {
                    if (!editItem) return
                    setDraft((p) => ({
                        ...p,
                        items: p.items.map((i) =>
                            i.exerciseId === editItem.exerciseId
                                ? {
                                      ...i,
                                      isOptional: config.isOptional,
                                      durationMinutes: config.durationMinutes,
                                  }
                                : i,
                        ),
                    }))
                    setEditItem(null)
                }}
                onRemove={() => {
                    if (!editItem) return
                    setDraft((p) => ({
                        ...p,
                        items: p.items
                            .filter((i) => i.exerciseId !== editItem.exerciseId)
                            .map((item, idx) => ({ ...item, sortOrder: idx })),
                    }))
                    setEditItem(null)
                }}
            />
        </div>
    )
}

function LayoutGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(240px,320px)_1fr]">
            {children}
        </div>
    )
}
