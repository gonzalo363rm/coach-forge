"use client"

import { useEffect, useState } from "react"

const MOBILE_LAYOUT_QUERY = "(max-width: 767px)"

export function useIsMobileLayout() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY)
        const update = () => setIsMobile(mediaQuery.matches)

        update()
        mediaQuery.addEventListener("change", update)
        return () => mediaQuery.removeEventListener("change", update)
    }, [])

    return isMobile
}
