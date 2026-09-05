"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

function BannerShell({ children }: { children: ReactNode }) {
    return (
        <div
            role="status"
            className="pointer-events-auto fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-1100 mx-auto w-[calc(100%-1.5rem)] max-w-lg rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
            {children}
        </div>
    )
}

function useServiceWorkerUpdateReady(): [boolean, () => void] {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return
        }

        let cancelled = false
        let cleanupRegistration: (() => void) | undefined

        const markReady = () => {
            if (!cancelled) setReady(true)
        }

        const onControllerChange = () => markReady()
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

        void navigator.serviceWorker.ready.then((registration) => {
            if (cancelled) return

            if (registration.waiting && navigator.serviceWorker.controller) {
                markReady()
            }

            const onUpdateFound = () => {
                const worker = registration.installing
                if (!worker) return
                worker.addEventListener("statechange", () => {
                    if (
                        worker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        markReady()
                    }
                })
            }

            registration.addEventListener("updatefound", onUpdateFound)

            const check = () => {
                void registration.update().catch(() => {})
            }
            check()
            const intervalId = window.setInterval(check, 60 * 60 * 1000)
            const onVisible = () => {
                if (document.visibilityState === "visible") check()
            }
            document.addEventListener("visibilitychange", onVisible)

            cleanupRegistration = () => {
                registration.removeEventListener("updatefound", onUpdateFound)
                window.clearInterval(intervalId)
                document.removeEventListener("visibilitychange", onVisible)
            }
        })

        return () => {
            cancelled = true
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                onControllerChange,
            )
            cleanupRegistration?.()
        }
    }, [])

    const dismiss = useCallback(() => setReady(false), [])
    return [ready, dismiss]
}

/**
 * Aviso cuando hay una nueva versión del service worker.
 * El instructivo de instalación vive en `/app`.
 */
export function PwaPrompts() {
    const [ready, dismiss] = useServiceWorkerUpdateReady()

    if (!ready) return null

    return (
        <div className="pointer-events-none fixed inset-0 z-1100">
            <BannerShell>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Nueva versión disponible
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Hay una actualización de Coach Forge. Recargá para usarla.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => window.location.reload()}>
                        Actualizar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={dismiss}>
                        Ahora no
                    </Button>
                </div>
            </BannerShell>
        </div>
    )
}
