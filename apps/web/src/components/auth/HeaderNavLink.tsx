"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useNavPending } from "@/hooks/use-nav-pending"
import { isNavActive, type NavSection } from "@/lib/nav-active"

const baseClass =
    "text-sm transition-colors hover:text-emerald-700 dark:hover:text-emerald-400"

type Props = {
    href: string
    label: string
    section?: NavSection
}

export function HeaderNavLink({ href, label, section }: Props) {
    const pathname = usePathname()
    const { pendingHref, startNavigation } = useNavPending()
    const effectivePath = pendingHref ?? pathname
    const active = isNavActive(effectivePath, href, section)

    return (
        <Link
            href={href}
            onClick={() => startNavigation(href)}
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
