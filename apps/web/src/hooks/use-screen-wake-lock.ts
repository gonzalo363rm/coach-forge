"use client"

import { useEffect, useRef } from "react"

/**
 * Mantiene la pantalla encendida mientras `enabled` es true.
 * El navegador libera el lock al ocultar la pestaña; se re-adquiere al volver.
 */
export function useScreenWakeLock(enabled: boolean) {
    const sentinelRef = useRef<WakeLockSentinel | null>(null)

    useEffect(() => {
        if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
            return
        }

        let cancelled = false

        const release = async () => {
            const current = sentinelRef.current
            sentinelRef.current = null
            if (!current || current.released) return
            try {
                await current.release()
            } catch {
                // ignore
            }
        }

        const request = async () => {
            if (cancelled || document.visibilityState !== "visible") return
            try {
                const sentinel = await navigator.wakeLock.request("screen")
                if (cancelled) {
                    await sentinel.release().catch(() => {})
                    return
                }
                sentinelRef.current = sentinel
                sentinel.addEventListener("release", () => {
                    if (sentinelRef.current === sentinel) {
                        sentinelRef.current = null
                    }
                })
            } catch {
                // Denegado por el SO, batería baja, etc.
            }
        }

        void request()

        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                void request()
            }
        }

        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            cancelled = true
            document.removeEventListener("visibilitychange", onVisibility)
            void release()
        }
    }, [enabled])
}
