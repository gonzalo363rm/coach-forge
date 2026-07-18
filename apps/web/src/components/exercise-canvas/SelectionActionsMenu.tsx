"use client"

import type { PointerEvent as ReactPointerEvent } from "react"

type Props = {
    x: number
    y: number
    onDuplicate: () => void
    onDelete: () => void
    onMovePointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

const btnClass =
    "rounded bg-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"

export function SelectionActionsMenu({
    x,
    y,
    onDuplicate,
    onDelete,
    onMovePointerDown,
}: Props) {
    return (
        <div
            className="absolute z-40 flex items-center gap-1 rounded-lg border border-zinc-300 bg-white p-1.5 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
            style={{ left: x, top: y }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button type="button" className={btnClass} onClick={onDuplicate}>
                Duplicar
            </button>
            <button
                type="button"
                className="rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
                onClick={onDelete}
            >
                Eliminar
            </button>
            <button
                type="button"
                aria-label="Mover selección"
                title="Mantener pulsado para mover"
                className="inline-flex size-8 cursor-grab items-center justify-center rounded bg-zinc-700 text-white hover:bg-zinc-800 active:cursor-grabbing dark:bg-zinc-600 dark:hover:bg-zinc-500"
                onPointerDown={onMovePointerDown}
            >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"
                    />
                </svg>
            </button>
        </div>
    )
}
