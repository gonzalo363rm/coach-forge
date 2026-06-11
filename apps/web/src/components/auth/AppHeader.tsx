import Link from "next/link"

import { auth } from "@/auth"
import { isStaffRole } from "@/lib/user-permissions"

import { AdminNavMenu } from "./AdminNavMenu"
import { HeaderNavLink } from "./HeaderNavLink"
import { NavDivider } from "./NavDivider"
import { UserNavMenu } from "./UserNavMenu"

export async function AppHeader() {
    const session = await auth()
    if (!session?.user) return null

    const { firstName, lastName, avatarUrl, role } = session.user
    const isAdmin = isStaffRole(role)

    return (
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-6 py-3">
                <div className="flex min-w-0 flex-1 justify-start">
                    <Link
                        href="/"
                        className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                    >
                        Coach Forge
                    </Link>
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

                    {isAdmin ? (
                        <>
                            <NavDivider />
                            <AdminNavMenu />
                        </>
                    ) : null}
                </nav>

                <div className="flex min-w-0 flex-1 justify-end">
                    <UserNavMenu
                        firstName={firstName}
                        lastName={lastName}
                        avatarUrl={avatarUrl}
                    />
                </div>
            </div>
        </header>
    )
}
