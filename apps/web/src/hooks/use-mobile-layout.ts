"use client"

import { useEffect, useState } from "react"

const MOBILE_LAYOUT_QUERY = "(max-width: 767px)"
/** Celulares en vertical o horizontal: no incluye tablets. */
const MOBILE_EDITOR_QUERY =
    "(max-width: 767px), (max-height: 500px) and (pointer: coarse)"

function useMatchMedia(query: string) {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia(query)
        const update = () => setMatches(mediaQuery.matches)

        update()
        mediaQuery.addEventListener("change", update)
        return () => mediaQuery.removeEventListener("change", update)
    }, [query])

    return matches
}

export function useIsMobileLayout() {
    return useMatchMedia(MOBILE_LAYOUT_QUERY)
}

export function useIsMobileEditor() {
    return useMatchMedia(MOBILE_EDITOR_QUERY)
}

export function useIsLandscape() {
    return useMatchMedia("(orientation: landscape)")
}
