"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandLogo } from "@/components/brand/BrandLogo"

const authLinkClass =
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4"

const navLinkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"

export function AppHeaderGuest() {
    const pathname = usePathname()
    if (pathname !== "/" && pathname !== "/app") return null

    return (
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                <BrandLogo />
                <nav
                    aria-label="Acceso"
                    className="flex shrink-0 items-center gap-2 sm:gap-3"
                >
                    <Link
                        href="/app"
                        className={`${navLinkClass} ${
                            pathname === "/app"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : ""
                        }`}
                    >
                        App
                    </Link>
                    <Link
                        href="/login"
                        className={`${authLinkClass} bg-emerald-600 text-white hover:bg-emerald-700`}
                    >
                        Iniciar sesión
                    </Link>
                    <Link
                        href="/register"
                        className={`${authLinkClass} border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900`}
                    >
                        Registrarse
                    </Link>
                </nav>
            </div>
        </header>
    )
}
