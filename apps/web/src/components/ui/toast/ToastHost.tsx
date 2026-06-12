"use client"

import { useToastStore, type ToastType } from "@/stores/toast.store"

function typeClasses(type: ToastType): { container: string; title: string } {
    switch (type) {
        case "success":
            return {
                container:
                    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-50",
                title: "text-emerald-900 dark:text-emerald-50",
            }
        case "info":
            return {
                container:
                    "border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                title: "text-zinc-900 dark:text-zinc-50",
            }
        default:
            return {
                container:
                    "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-50",
                title: "text-red-900 dark:text-red-50",
            }
    }
}

export function ToastHost() {
    const toasts = useToastStore((s) => s.toasts)
    const remove = useToastStore((s) => s.remove)

    return (
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
                                    <div className={`text-sm font-semibold ${cls.title}`}>
                                        {t.title}
                                    </div>
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
    )
}
