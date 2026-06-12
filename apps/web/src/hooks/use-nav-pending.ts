"use client"

import { usePathname } from "next/navigation"
import { useCallback } from "react"

import { useNavStore } from "@/stores/nav.store"

export function useNavPending() {
    const pathname = usePathname()
    const pendingHref = useNavStore((s) => s.pendingHref)
    const startNavigationRaw = useNavStore((s) => s.startNavigation)

    const startNavigation = useCallback(
        (href: string) => {
            startNavigationRaw(href, pathname)
        },
        [pathname, startNavigationRaw],
    )

    return {
        pendingHref,
        startNavigation,
        isNavigating: pendingHref !== null,
    }
}
