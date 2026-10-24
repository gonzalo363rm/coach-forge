"use client"

import { useEffect, useId } from "react"
import clsx from "clsx"

type Props = {
    open: boolean
    title: string
    onClose: () => void
    /** Inferior en vertical; lateral derecho en horizontal. */
    placement?: "bottom" | "side"
    children: React.ReactNode
    className?: string
}

export function MobileSheet({
    open,
    title,
    onClose,
    placement = "bottom",
    children,
    className,
}: Props) {
    const titleId = useId()

    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    if (!open) return null

    const isSide = placement === "side"

    return (
        <div className="absolute inset-0 z-[60] flex" role="presentation">
            <button
                type="button"
                aria-label="Cerrar panel"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={clsx(
                    "relative z-10 flex flex-col bg-zinc-100 shadow-2xl dark:bg-zinc-900",
                    isSide
                        ? "ml-auto h-full w-[min(100%,360px)] border-l border-zinc-300 dark:border-zinc-700"
                        : "mt-auto max-h-[75dvh] w-full rounded-t-2xl border-t border-zinc-300 dark:border-zinc-700",
                    className,
                )}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-300 px-4 py-3 dark:border-zinc-700">
                    <h2
                        id={titleId}
                        className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                        aria-label="Cerrar"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
            </div>
        </div>
    )
}
