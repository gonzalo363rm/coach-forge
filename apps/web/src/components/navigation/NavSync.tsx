"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useNavStore } from "@/stores/nav.store"

/** Limpia la navegación pendiente cuando cambia la ruta. */
export function NavSync() {
    const pathname = usePathname()
    const clearPending = useNavStore((s) => s.clearPending)

    useEffect(() => {
        clearPending()
    }, [pathname, clearPending])

    return null
}
