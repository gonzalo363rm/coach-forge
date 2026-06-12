"use client"

import { NavSync } from "@/components/navigation/NavSync"
import { NavigationProgress } from "@/components/navigation/NavigationProgress"
import { ToastHost } from "@/components/ui/toast/ToastHost"

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            <NavSync />
            <NavigationProgress />
            <ToastHost />
            {children}
        </>
    )
}
