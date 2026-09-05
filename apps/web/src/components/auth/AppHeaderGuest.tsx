"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandLogo } from "@/components/brand/BrandLogo"

const GUEST_HEADER_PATHS = ["/", "/app", "/explore"]

function showGuestHeader(pathname: string): boolean {
    return GUEST_HEADER_PATHS.some(
        (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
    )
}

export function AppHeaderGuest() {
    const pathname = usePathname()
    if (!showGuestHeader(pathname)) return null

    return (
        <header className="overflow-x-clip border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
                <BrandLogo className="min-w-0 shrink origin-left scale-[0.85] sm:scale-100 [&_.brand-logo-tagline]:max-[360px]:hidden" />
                <nav
                    aria-label="Acceso"
                    className="flex shrink-0 items-center gap-1.5 sm:gap-3"
                >
                    <Link
                        href="/login"
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 sm:px-4 sm:py-2 sm:text-sm"
                    >
                        Iniciar sesión
                    </Link>
                    <Link
                        href="/register"
                        className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900 sm:px-4 sm:py-2 sm:text-sm"
                    >
                        Registrarse
                    </Link>
                </nav>
            </div>
        </header>
    )
}
