"use client"

import { useEffect, useRef, useState } from "react"

import { useToastStore } from "@/stores/toast.store"

function isWriteMethod(method: string): boolean {
    const normalized = method.toUpperCase()
    return normalized !== "GET" && normalized !== "HEAD" && normalized !== "OPTIONS"
}

/**
 * Banner de sin conexión + bloqueo de mutaciones offline.
 * Las lecturas las resuelve el service worker con la última respuesta cacheada.
 */
export function OfflineGuard() {
    const [offline, setOffline] = useState(false)
    const wasOfflineRef = useRef(false)
    const toast = useToastStore((s) => s.toast)

    useEffect(() => {
        const sync = () => {
            const nextOffline = typeof navigator !== "undefined" && !navigator.onLine
            setOffline(nextOffline)

            if (nextOffline && !wasOfflineRef.current) {
                toast({
                    type: "info",
                    title: "Sin conexión",
                    message: "Mostramos la última información guardada. Los cambios no se enviarán hasta recuperar red.",
                    durationMs: 6000,
                })
            } else if (!nextOffline && wasOfflineRef.current) {
                toast({
                    type: "success",
                    title: "Conexión restaurada",
                    message: "Ya podés sincronizar y guardar cambios.",
                    durationMs: 4000,
                })
            }
            wasOfflineRef.current = nextOffline
        }

        sync()
        window.addEventListener("online", sync)
        window.addEventListener("offline", sync)
        return () => {
            window.removeEventListener("online", sync)
            window.removeEventListener("offline", sync)
        }
    }, [toast])

    useEffect(() => {
        const originalFetch = window.fetch.bind(window)

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const method =
                init?.method ??
                (input instanceof Request ? input.method : "GET")

            if (!navigator.onLine && isWriteMethod(method)) {
                toast({
                    type: "error",
                    title: "Sin conexión",
                    message: "No se puede guardar ni enviar cambios sin internet.",
                    durationMs: 5000,
                })
                throw new TypeError("Offline: write request blocked")
            }

            return originalFetch(input, init)
        }

        return () => {
            window.fetch = originalFetch
        }
    }, [toast])

    if (!offline) return null

    return (
        <div
            role="status"
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
        >
            Sin conexión. Estás viendo datos guardados; no se enviarán cambios hasta recuperar
            internet.
        </div>
    )
}
