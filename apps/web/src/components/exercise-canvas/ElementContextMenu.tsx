'use client'

import type { ArrowElementInstance, CircleElementInstance, ImageElementInstance, LineElementInstance, RectElementInstance } from "@/interfaces"

interface Props {
    isOpen: boolean
    x: number
    y: number
    targetType: "image" | "circle" | "rect" | "line" | "arrow"
    contextElement: ImageElementInstance | CircleElementInstance | RectElementInstance | LineElementInstance | ArrowElementInstance
    assignedPlayersDraft: string
    maxRotation: number
    defaultElementColor: string
    onAssignedPlayersDraftChange: (value: string) => void
    onAssignedPlayersCommit: () => void
    onUpdate: (
        updater: (
            element: ImageElementInstance | CircleElementInstance | RectElementInstance | LineElementInstance | ArrowElementInstance
        ) => ImageElementInstance | CircleElementInstance | RectElementInstance | LineElementInstance | ArrowElementInstance
    ) => void
    onClose: () => void
    onDelete: () => void
    onDuplicate: () => void
    onRotateArrow: (nextRotation: number) => void
}

export const ElementContextMenu = ({
    isOpen,
    x,
    y,
    targetType,
    contextElement,
    assignedPlayersDraft,
    maxRotation,
    defaultElementColor,
    onAssignedPlayersDraftChange,
    onAssignedPlayersCommit,
    onUpdate,
    onClose,
    onDelete,
    onDuplicate,
    onRotateArrow,
}: Props) => {
    if (!isOpen) return null

    return (
        <div
            className="absolute z-50 w-72 rounded-xl bg-zinc-100 p-3 shadow-xl dark:bg-zinc-800"
            style={{ left: x + 8, top: y + 8 }}
        >
            <div className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {targetType === "arrow" ? "Configurar flecha" : "Configurar elemento"}
            </div>
            <div className="mb-2 mt-1 h-px bg-zinc-300 dark:bg-zinc-600" />

            <div className="flex flex-col gap-2 text-xs">
                <label className="flex flex-col gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Titulo</span>
                    <input
                        value={contextElement.label ?? ""}
                        onChange={(e) => onUpdate((element) => ({ ...element, label: e.target.value || undefined }))}
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Descripcion</span>
                    <textarea
                        value={contextElement.description ?? ""}
                        onChange={(e) => onUpdate((element) => ({ ...element, description: e.target.value || undefined }))}
                        className="min-h-16 rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Jugadores asignados</span>
                    <input
                        value={assignedPlayersDraft}
                        onChange={(e) => onAssignedPlayersDraftChange(e.target.value)}
                        onBlur={onAssignedPlayersCommit}
                        placeholder="Ej: Juan, Pedro, Lucia"
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Orden</span>
                    <input
                        type="number"
                        min={0}
                        value={contextElement.order ?? ""}
                        onChange={(e) => {
                            const value = e.target.value.trim()
                            onUpdate((element) => ({
                                ...element,
                                order: value === "" ? undefined : Math.max(0, Number(value)),
                            }))
                        }}
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                    />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-500 dark:text-zinc-400">Capa</span>
                        <input
                            type="number"
                            value={contextElement.zIndex ?? 0}
                            onChange={(e) => {
                                const value = Number(e.target.value)
                                onUpdate((element) => ({ ...element, zIndex: Number.isFinite(value) ? value : 0 }))
                            }}
                            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-500 dark:text-zinc-400">Rotacion</span>
                        <input
                            type="number"
                            min={0}
                            max={maxRotation}
                            value={contextElement.rotation ?? 0}
                            onChange={(e) => {
                                const nextRotation = Number(e.target.value)
                                if (targetType !== "arrow") {
                                    onUpdate((element) => ({ ...element, rotation: nextRotation }))
                                    return
                                }
                                onRotateArrow(nextRotation)
                            }}
                            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                        />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400">
                        {targetType === "arrow" ? "Color de flecha / orden" : "Color de borde / orden"}
                    </span>
                    <input
                        type="color"
                        value={contextElement.style?.strokeColor ?? defaultElementColor}
                        onChange={(e) => {
                            const color = e.target.value
                            onUpdate((element) => ({
                                ...element,
                                style: {
                                    ...element.style,
                                    strokeColor: color,
                                },
                            }))
                        }}
                        className="h-9 w-full rounded border border-zinc-300 bg-white px-1 dark:border-zinc-600 dark:bg-zinc-700"
                    />
                </label>

                <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded bg-zinc-200 px-2 py-1.5 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="rounded bg-zinc-700 px-2 py-1.5 text-white hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500"
                    >
                        Duplicar
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded bg-red-600 px-2 py-1.5 text-white hover:bg-red-700"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    )
}

