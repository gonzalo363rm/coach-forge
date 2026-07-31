"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { IoChevronDownOutline } from "react-icons/io5"

import { CLUB_NAV_LINKS, isClubNavLinkActive } from "@/lib/club-nav-links"

import { useNavPending } from "@/hooks/use-nav-pending"

const clubLinks = CLUB_NAV_LINKS

const menuLinkClass =
    "block px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-emerald-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"

export function ClubNavMenu() {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const { pendingHref, startNavigation } = useNavPending()
    const effectivePath = pendingHref ?? pathname
    const isClubSection = effectivePath === "/club" || effectivePath.startsWith("/club/")

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener("mousedown", handlePointerDown)
        }

        return () => document.removeEventListener("mousedown", handlePointerDown)
    }, [open])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="menu"
                className={`cursor-pointer inline-flex items-center gap-1 text-sm transition-colors ${
                    isClubSection
                        ? "font-medium text-emerald-700 dark:text-emerald-400"
                        : "text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"
                }`}
            >
                Mi Club
                <IoChevronDownOutline
                    className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                />
            </button>

            {open ? (
                <div
                    role="menu"
                    className="absolute left-0 top-full z-50 mt-1.5 min-w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                >
                    {clubLinks.map((link) => {
                        const isActive = isClubNavLinkActive(
                            effectivePath,
                            link.href,
                            link.match,
                        )

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                role="menuitem"
                                onClick={() => {
                                    startNavigation(link.href)
                                    setOpen(false)
                                }}
                                className={`${menuLinkClass} ${
                                    isActive
                                        ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : ""
                                }`}
                            >
                                {link.label}
                            </Link>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}
