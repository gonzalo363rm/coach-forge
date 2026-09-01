"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { IoCloseOutline, IoMenuOutline } from "react-icons/io5"
import clsx from "clsx"

import { logoutAction } from "@/app/actions/auth"
import { BrandLogo } from "@/components/brand/BrandLogo"
import { useNavPending } from "@/hooks/use-nav-pending"
import { useToast } from "@/hooks/use-toast"
import { adminNavLinksForRole } from "@/lib/admin-nav-links"
import { CLUB_NAV_LINKS, isClubNavLinkActive } from "@/lib/club-nav-links"
import { isNavActive, type NavSection } from "@/lib/nav-active"
import type { Role } from "@prisma/client"

import { AdminNavMenu } from "./AdminNavMenu"
import { ClubNavMenu } from "./ClubNavMenu"
import { HeaderAvatar } from "./HeaderAvatar"
import { HeaderNavLink } from "./HeaderNavLink"
import { NavDivider } from "./NavDivider"
import { UserNavMenu } from "./UserNavMenu"

const MOBILE_SHELL_H_CLOSED = 40
const MOBILE_SHELL_H_OPEN = 56
const MOBILE_MENU_BTN = 36
const MOBILE_ANIM_MS = 220
const MOBILE_USER_OPEN_X = 12 // px-3, alineado con ítems del nav

type Props = {
    firstName: string
    lastName: string
    avatarUrl: string | null
    isAdmin: boolean
    isClubManager: boolean
    role: Role
    showPlansLink: boolean
    showMyPaymentsLink: boolean
}

const MOBILE_MENU_LINK =
    "block rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"

const MOBILE_MORPH =
    "absolute left-0 top-0 will-change-transform motion-reduce:transition-none"

const MORPH_TRANSITION = `transform ${MOBILE_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`

function applyMorphTransforms(
    shell: HTMLDivElement,
    logo: HTMLDivElement,
    user: HTMLDivElement,
    menuBtn: HTMLButtonElement,
    open: boolean,
) {
    const shellW = shell.clientWidth
    const logoRect = logo.getBoundingClientRect()
    const userRect = user.getBoundingClientRect()
    const menuBtnX = shellW - MOBILE_MENU_BTN

    const logoClosedY = (MOBILE_SHELL_H_CLOSED - logoRect.height) / 2
    const userClosedX = shellW - userRect.width - MOBILE_MENU_BTN
    const userClosedY = (MOBILE_SHELL_H_CLOSED - userRect.height) / 2
    const menuBtnClosedY = (MOBILE_SHELL_H_CLOSED - MOBILE_MENU_BTN) / 2

    if (open) {
        logo.style.transform = `translate3d(${(shellW - logoRect.width) / 2}px, 6px, 0)`
        user.style.transform = `translate3d(${MOBILE_USER_OPEN_X}px, ${shell.clientHeight}px, 0)`
        menuBtn.style.transform = `translate3d(${menuBtnX}px, 0px, 0)`
        return
    }

    logo.style.transform = `translate3d(0px, ${logoClosedY}px, 0)`
    user.style.transform = `translate3d(${userClosedX}px, ${userClosedY}px, 0)`
    menuBtn.style.transform = `translate3d(${menuBtnX}px, ${menuBtnClosedY}px, 0)`
}

function MobileNavLink({
    href,
    label,
    section,
    onNavigate,
}: {
    href: string
    label: string
    section?: NavSection
    onNavigate: () => void
}) {
    const pathname = usePathname()
    const { pendingHref, startNavigation } = useNavPending()
    const effectivePath = pendingHref ?? pathname
    const active = isNavActive(effectivePath, href, section)

    return (
        <Link
            href={href}
            onClick={() => {
                startNavigation(href)
                onNavigate()
            }}
            className={clsx(
                MOBILE_MENU_LINK,
                active
                    ? "font-medium text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-700 dark:text-zinc-300",
            )}
            aria-current={active ? "page" : undefined}
        >
            {label}
        </Link>
    )
}

function MobileClubLinks({ onNavigate }: { onNavigate: () => void }) {
    const pathname = usePathname()
    const { pendingHref, startNavigation } = useNavPending()
    const effectivePath = pendingHref ?? pathname

    return (
        <div className="space-y-0">
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Mi Club
            </p>
            {CLUB_NAV_LINKS.map((link) => {
                const active = isClubNavLinkActive(
                    effectivePath,
                    link.href,
                    link.match,
                )

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                            startNavigation(link.href)
                            onNavigate()
                        }}
                        className={clsx(
                            MOBILE_MENU_LINK,
                            active
                                ? "font-medium text-emerald-700 dark:text-emerald-400"
                                : "text-zinc-700 dark:text-zinc-300",
                        )}
                    >
                        {link.label}
                    </Link>
                )
            })}
        </div>
    )
}

function MobileAdminLinks({
    onNavigate,
    role,
}: {
    onNavigate: () => void
    role: Role
}) {
    const pathname = usePathname()
    const { pendingHref, startNavigation } = useNavPending()
    const effectivePath = pendingHref ?? pathname

    return (
        <div className="space-y-0">
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Administración
            </p>
            {adminNavLinksForRole(role).map((link) => {
                const active =
                    effectivePath === link.href ||
                    effectivePath.startsWith(`${link.href}/`)

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                            startNavigation(link.href)
                            onNavigate()
                        }}
                        className={clsx(
                            MOBILE_MENU_LINK,
                            active
                                ? "font-medium text-emerald-700 dark:text-emerald-400"
                                : "text-zinc-700 dark:text-zinc-300",
                        )}
                    >
                        {link.label}
                    </Link>
                )
            })}
        </div>
    )
}

export function AppHeaderClient({
    firstName,
    lastName,
    avatarUrl,
    isAdmin,
    isClubManager,
    role,
    showPlansLink,
    showMyPaymentsLink,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [morphActive, setMorphActive] = useState(false)
    const [userRowHeight, setUserRowHeight] = useState(0)
    const [pending, startTransition] = useTransition()
    const shellRef = useRef<HTMLDivElement>(null)
    const logoRef = useRef<HTMLDivElement>(null)
    const userRef = useRef<HTMLDivElement>(null)
    const menuBtnRef = useRef<HTMLButtonElement>(null)
    const pathname = usePathname()
    const { pendingHref, startNavigation } = useNavPending()
    const { toast } = useToast()
    const effectivePath = pendingHref ?? pathname
    const fullName = `${firstName} ${lastName}`.trim()

    const closeMenu = () => setMenuOpen(false)

    const openMenu = () => {
        setMorphActive(true)
        requestAnimationFrame(() => {
            setMenuOpen(true)
        })
    }

    const applyMorph = useCallback((open: boolean) => {
        const shell = shellRef.current
        const logo = logoRef.current
        const user = userRef.current
        const menuBtn = menuBtnRef.current
        if (!shell || !logo || !user || !menuBtn) return
        applyMorphTransforms(shell, logo, user, menuBtn, open)
        if (open) {
            setUserRowHeight(user.offsetHeight)
        }
    }, [])

    useLayoutEffect(() => {
        if (!morphActive) return
        applyMorph(menuOpen)
    }, [morphActive, menuOpen, fullName, applyMorph])

    useEffect(() => {
        if (!morphActive) return
        const onResize = () => applyMorph(menuOpen)
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [morphActive, menuOpen, applyMorph])

    useEffect(() => {
        setMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        if (!menuOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [menuOpen])

    useEffect(() => {
        if (!menuOpen) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [menuOpen])

    function handleLogout() {
        startTransition(async () => {
            const result = await logoutAction()
            if (!result.ok) {
                toast({ message: result.error, type: "error" })
            }
        })
    }

    return (
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            {/* Desktop */}
            <div className="mx-auto hidden max-w-6xl items-center gap-x-4 px-6 py-3 md:flex">
                <div className="flex min-w-0 flex-1 justify-start">
                    <BrandLogo />
                </div>

                <nav
                    aria-label="Navegación principal"
                    className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1"
                >
                    <HeaderNavLink
                        href="/classes/mine"
                        label="Mis clases"
                        section="classes-mine"
                    />
                    <NavDivider />
                    <HeaderNavLink
                        href="/exercises/mine"
                        label="Mis ejercicios"
                        section="exercises-mine"
                    />
                    {showPlansLink ? (
                        <>
                            <NavDivider />
                            <HeaderNavLink href="/plans" label="Planes" />
                        </>
                    ) : null}
                    {isClubManager ? (
                        <>
                            <NavDivider />
                            <ClubNavMenu />
                        </>
                    ) : null}
                    {isAdmin ? (
                        <>
                            <NavDivider />
                            <AdminNavMenu role={role} />
                        </>
                    ) : null}
                </nav>

                <div className="flex min-w-0 flex-1 justify-end">
                    <UserNavMenu
                        firstName={firstName}
                        lastName={lastName}
                        avatarUrl={avatarUrl}
                        showMyPaymentsLink={showMyPaymentsLink}
                    />
                </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
                <div className={clsx("px-4", menuOpen ? "pb-4 pt-3" : "py-3")}>
                    {!morphActive ? (
                        <div className="flex min-h-10 items-center justify-between">
                            <BrandLogo />
                            <div className="flex items-center gap-2">
                                <div className="origin-left scale-[0.88]">
                                    <HeaderAvatar
                                        avatarUrl={avatarUrl}
                                        firstName={firstName}
                                        lastName={lastName}
                                        size="md"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={openMenu}
                                    aria-expanded={false}
                                    aria-controls="mobile-nav-panel"
                                    aria-label="Abrir menú"
                                    className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                                >
                                    <IoMenuOutline className="size-6" aria-hidden />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            ref={shellRef}
                            className="relative overflow-visible"
                            style={{ height: menuOpen ? MOBILE_SHELL_H_OPEN : MOBILE_SHELL_H_CLOSED }}
                        >
                            <div
                                ref={logoRef}
                                className={clsx(MOBILE_MORPH, "z-10")}
                                style={{ transition: MORPH_TRANSITION }}
                            >
                                <BrandLogo />
                            </div>

                            <div
                                ref={userRef}
                                className={clsx(
                                    MOBILE_MORPH,
                                    "z-20 flex items-center gap-2",
                                    menuOpen && MOBILE_MENU_LINK.replace("px-3 ", ""),
                                )}
                                style={{ transition: MORPH_TRANSITION }}
                            >
                                <div
                                    className={clsx(
                                        "origin-left motion-reduce:transition-none",
                                        menuOpen ? "scale-110" : "scale-[0.88]",
                                    )}
                                    style={{ transition: MORPH_TRANSITION }}
                                >
                                    <HeaderAvatar
                                        avatarUrl={avatarUrl}
                                        firstName={firstName}
                                        lastName={lastName}
                                        size="md"
                                    />
                                </div>
                                <span
                                    className={clsx(
                                        "truncate text-sm font-medium text-zinc-700 dark:text-zinc-300",
                                        menuOpen ? "max-w-36 opacity-100" : "hidden opacity-0",
                                    )}
                                    style={{ transition: `opacity ${MOBILE_ANIM_MS}ms ease-out` }}
                                >
                                    {fullName}
                                </span>
                            </div>

                            <button
                                ref={menuBtnRef}
                                type="button"
                                onClick={() => setMenuOpen((open) => !open)}
                                aria-expanded={menuOpen}
                                aria-controls="mobile-nav-panel"
                                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                                className={clsx(
                                    MOBILE_MORPH,
                                    "z-30 flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                                )}
                                style={{ transition: MORPH_TRANSITION }}
                            >
                                {menuOpen ? (
                                    <IoCloseOutline className="size-6" aria-hidden />
                                ) : (
                                    <IoMenuOutline className="size-6" aria-hidden />
                                )}
                            </button>

                            <div
                                className={clsx(
                                    "pointer-events-none absolute inset-x-0 bottom-0 z-5 h-px bg-linear-to-r from-transparent via-zinc-500/70 to-transparent motion-reduce:transition-none",
                                    menuOpen ? "opacity-100" : "opacity-0",
                                )}
                                style={{ transition: `opacity ${MOBILE_ANIM_MS}ms ease-out` }}
                                aria-hidden
                            />
                        </div>
                    )}

                    {menuOpen ? (
                        <div id="mobile-nav-panel">
                            <div
                                style={{ height: userRowHeight || undefined }}
                                className={userRowHeight ? undefined : "h-12"}
                                aria-hidden
                            />

                            <nav aria-label="Navegación principal" className="space-y-0">
                                <MobileNavLink
                                    href="/classes/mine"
                                    label="Mis clases"
                                    section="classes-mine"
                                    onNavigate={closeMenu}
                                />
                                <MobileNavLink
                                    href="/exercises/mine"
                                    label="Mis ejercicios"
                                    section="exercises-mine"
                                    onNavigate={closeMenu}
                                />
                                {showPlansLink ? (
                                    <MobileNavLink
                                        href="/plans"
                                        label="Planes"
                                        onNavigate={closeMenu}
                                    />
                                ) : null}
                                {isClubManager ? (
                                    <MobileClubLinks onNavigate={closeMenu} />
                                ) : null}
                                {isAdmin ? (
                                    <MobileAdminLinks onNavigate={closeMenu} role={role} />
                                ) : null}
                            </nav>

                            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                                {showMyPaymentsLink ? (
                                    <Link
                                        href="/payments/mine"
                                        onClick={() => {
                                            startNavigation("/payments/mine")
                                            closeMenu()
                                        }}
                                        className={clsx(
                                            MOBILE_MENU_LINK,
                                            effectivePath === "/payments/mine"
                                                ? "font-medium text-emerald-700 dark:text-emerald-400"
                                                : "text-zinc-700 dark:text-zinc-300",
                                        )}
                                    >
                                        Mis pagos
                                    </Link>
                                ) : null}
                                <Link
                                    href="/profile"
                                    onClick={() => {
                                        startNavigation("/profile")
                                        closeMenu()
                                    }}
                                    className={clsx(
                                        MOBILE_MENU_LINK,
                                        effectivePath === "/profile"
                                            ? "font-medium text-emerald-700 dark:text-emerald-400"
                                            : "text-zinc-700 dark:text-zinc-300",
                                    )}
                                >
                                    Editar perfil
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={pending}
                                    className={clsx(
                                        MOBILE_MENU_LINK,
                                        "w-full text-left disabled:opacity-60",
                                    )}
                                >
                                    {pending ? "Cerrando sesión…" : "Cerrar sesión"}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    )
}
