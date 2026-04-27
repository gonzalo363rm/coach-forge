"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

type ToastType = "error" | "success" | "info"

export type ToastInput = {
    type?: ToastType
    title?: string
    message: string
    /** Auto-cierre en ms (por defecto 4500). */
    durationMs?: number
}

type Toast = Required<Pick<ToastInput, "message">> &
    Pick<ToastInput, "title"> & {
        id: string
        type: ToastType
        durationMs: number
    }

type ToastContextValue = {
    toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function typeClasses(type: ToastType): { container: string; title: string } {
    switch (type) {
        case "success":
            return {
                container: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-50",
                title: "text-emerald-900 dark:text-emerald-50",
            }
        case "info":
            return {
                container: "border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                title: "text-zinc-900 dark:text-zinc-50",
            }
        default:
            return {
                container: "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-50",
                title: "text-red-900 dark:text-red-50",
            }
    }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const seq = useRef(0)

    const remove = useCallback((id: string) => {
        setToasts((current) => current.filter((t) => t.id !== id))
    }, [])

    const toast = useCallback(
        (input: ToastInput) => {
            const id = `${Date.now()}_${seq.current++}`
            const next: Toast = {
                id,
                type: input.type ?? "info",
                title: input.title,
                message: input.message,
                durationMs: input.durationMs ?? 4500,
            }

            setToasts((current) => [...current, next])

            window.setTimeout(() => {
                remove(id)
            }, next.durationMs)
        },
        [remove],
    )

    const value = useMemo<ToastContextValue>(() => ({ toast }), [toast])

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed right-4 top-4 z-1000 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
                aria-live="polite"
                aria-relevant="additions"
            >
                {toasts.map((t) => {
                    const cls = typeClasses(t.type)
                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${cls.container}`}
                            role="status"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    {t.title ? (
                                        <div className={`text-sm font-semibold ${cls.title}`}>{t.title}</div>
                                    ) : null}
                                    <div className="mt-0.5 text-sm">{t.message}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(t.id)}
                                    className="rounded-md px-2 py-1 text-sm opacity-80 transition-opacity hover:opacity-100"
                                    aria-label="Cerrar"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        throw new Error("useToast debe usarse dentro de <ToastProvider>")
    }
    return ctx
}

