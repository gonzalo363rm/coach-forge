"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type { ExerciseListItem } from "@/services/exercises.service"

import type { ClassDraftExerciseItem } from "./class-draft-storage"

type AddProps = {
    mode: "add"
    open: boolean
    exercise: ExerciseListItem | null
    onClose: () => void
    onConfirm: (config: { durationMinutes: number | null; isOptional: boolean }) => void
}

type EditProps = {
    mode: "edit"
    open: boolean
    item: ClassDraftExerciseItem | null
    onClose: () => void
    onConfirm: (config: { durationMinutes: number | null; isOptional: boolean }) => void
    onRemove?: () => void
}

type Props = AddProps | EditProps

export function ClassExerciseConfigModal(props: Props) {
    const [duration, setDuration] = useState("5")
    const [isOptional, setIsOptional] = useState(false)

    const title =
        props.mode === "add"
            ? props.exercise?.title ?? ""
            : props.item?.title ?? ""

    const isOpen =
        props.mode === "add"
            ? props.open && props.exercise != null
            : props.open && props.item != null

    useEffect(() => {
        if (!isOpen) return
        if (props.mode === "edit" && props.item) {
            setIsOptional(props.item.isOptional)
            setDuration(
                props.item.isOptional
                    ? "5"
                    : String(props.item.durationMinutes ?? 5),
            )
            return
        }
        setDuration("5")
        setIsOptional(false)
    }, [isOpen, props])

    if (!isOpen) return null

    const handleConfirm = () => {
        if (isOptional) {
            props.onConfirm({ durationMinutes: null, isOptional: true })
            return
        }
        const n = parseInt(duration, 10)
        if (Number.isNaN(n) || n < 1) return
        props.onConfirm({ durationMinutes: n, isOptional: false })
    }

    const heading =
        props.mode === "add" ? `Añadir: ${title}` : `Editar en la clase: ${title}`

    const confirmLabel = props.mode === "add" ? "Añadir a la clase" : "Guardar"

    return (
        <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) props.onClose()
            }}
        >
            <div
                className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                role="dialog"
                aria-modal="true"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{heading}</h3>
                <div className="mt-4 flex flex-col gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <input
                            type="checkbox"
                            checked={isOptional}
                            onChange={(e) => setIsOptional(e.target.checked)}
                            className="rounded border-zinc-300"
                        />
                        Ejercicio opcional (sin tiempo)
                    </label>
                    {!isOptional ? (
                        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                            Duración (minutos)
                            <input
                                type="number"
                                min={1}
                                max={999}
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
                            />
                        </label>
                    ) : null}
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    {props.mode === "edit" && props.onRemove ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            className="mr-auto"
                            onClick={() => {
                                props.onRemove?.()
                                props.onClose()
                            }}
                        >
                            Quitar de la clase
                        </Button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={props.onClose}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="primary" onClick={handleConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}
