import { create } from "zustand"

import { normalizeNavHref } from "@/lib/nav-active"

type NavState = {
    pendingHref: string | null
    startNavigation: (href: string, currentPathname: string) => void
    clearPending: () => void
}

export const useNavStore = create<NavState>((set) => ({
    pendingHref: null,

    startNavigation: (href, currentPathname) => {
        const target = normalizeNavHref(href)
        if (target === currentPathname) return
        set({ pendingHref: target })
    },

    clearPending: () => set({ pendingHref: null }),
}))
