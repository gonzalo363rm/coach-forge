"use client"

import { useNavPending } from "@/hooks/use-nav-pending"

export function NavigationProgress() {
    const { isNavigating } = useNavPending()

    if (!isNavigating) return null

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-emerald-200/40 dark:bg-emerald-950/50"
            role="progressbar"
            aria-label="Cargando página"
            aria-busy="true"
        >
            <div className="nav-progress-bar h-full w-1/3 bg-emerald-600 dark:bg-emerald-400" />
        </div>
    )
}
