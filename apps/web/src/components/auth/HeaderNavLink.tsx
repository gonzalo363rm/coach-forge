"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const baseClass =
    "text-sm transition-colors hover:text-emerald-700 dark:hover:text-emerald-400"

type Section = "classes-mine" | "exercises-mine"

type Props = {
    href: string
    label: string
    section?: Section
}

function isNavActive(pathname: string, href: string, section?: Section): boolean {
    if (pathname === href) return true

    if (section === "classes-mine") {
        return pathname.startsWith("/classes/") && pathname !== "/classes/new"
    }

    if (section === "exercises-mine") {
        return pathname.startsWith("/exercises/") && pathname !== "/exercises/new"
    }

    return pathname.startsWith(`${href}/`)
}

export function HeaderNavLink({ href, label, section }: Props) {
    const pathname = usePathname()
    const active = isNavActive(pathname, href, section)

    return (
        <Link
            href={href}
            className={`${baseClass} ${
                active
                    ? "font-medium text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-600 dark:text-zinc-400"
            }`}
            aria-current={active ? "page" : undefined}
        >
            {label}
        </Link>
    )
}
