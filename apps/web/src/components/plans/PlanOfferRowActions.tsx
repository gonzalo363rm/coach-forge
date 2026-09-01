"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { IoEllipsisVertical } from "react-icons/io5"

import { updatePlanOfferStatusAction } from "@/app/actions/plan-offers"
import { useToast } from "@/hooks/use-toast"

const menuItemClass =
    "block w-full px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-emerald-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"

type Props = {
    planId: string
    offerId: string
    status: "active" | "inactive"
}

export function PlanOfferRowActions({ planId, offerId, status }: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false)
        }

        if (open) {
            document.addEventListener("mousedown", handlePointerDown)
            document.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    async function toggleStatus() {
        setPending(true)
        const result = await updatePlanOfferStatusAction({
            id: offerId,
            status: status === "active" ? "inactive" : "active",
        })
        setPending(false)
        setOpen(false)
        if (!result.ok) {
            toast({
                type: "error",
                title: "No se pudo cambiar el estado",
                message: result.error,
            })
            return
        }
        router.refresh()
    }

    return (
        <div ref={containerRef} className="relative flex justify-end">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Acciones de la oferta"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                onClick={() => setOpen((value) => !value)}
            >
                <IoEllipsisVertical className="size-4" aria-hidden />
            </button>
            {open ? (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                >
                    <Link
                        href={`/admin/plans/${planId}/offers/${offerId}/edit`}
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setOpen(false)}
                    >
                        Editar
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        disabled={pending}
                        className={`${menuItemClass} disabled:opacity-60`}
                        onClick={() => void toggleStatus()}
                    >
                        {pending
                            ? "…"
                            : status === "active"
                              ? "Desactivar"
                              : "Activar"}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
