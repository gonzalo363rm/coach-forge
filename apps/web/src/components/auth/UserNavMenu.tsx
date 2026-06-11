"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { IoChevronDownOutline } from "react-icons/io5"

import { logoutAction } from "@/app/actions/auth"
import { useToast } from "@/components/ui/toast/ToastProvider"

import { HeaderAvatar } from "./HeaderAvatar"

type Props = {
    firstName: string
    lastName: string
    avatarUrl: string | null
}

const menuLinkClass =
    "block px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-emerald-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"

export function UserNavMenu({ firstName, lastName, avatarUrl }: Props) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()
    const containerRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const { toast } = useToast()

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

    function handleLogout() {
        startTransition(async () => {
            const result = await logoutAction()
            if (!result.ok) {
                toast({ message: result.error, type: "error" })
            }
        })
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-lg py-1 pr-1 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
                <HeaderAvatar
                    avatarUrl={avatarUrl}
                    firstName={firstName}
                    lastName={lastName}
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {firstName} {lastName}
                </span>
                <IoChevronDownOutline
                    className={`size-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                />
            </button>

            {open ? (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1.5 min-w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                >
                    <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className={`${menuLinkClass} ${
                            pathname === "/profile"
                                ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : ""
                        }`}
                    >
                        Editar perfil
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        disabled={pending}
                        className={`${menuLinkClass} w-full text-left disabled:opacity-60`}
                    >
                        {pending ? "Cerrando sesión…" : "Cerrar sesión"}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
