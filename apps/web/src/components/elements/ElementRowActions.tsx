"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"

type DeleteResult = { ok: true } | { ok: false; error: string }

type Props = {
    id: string
    name: string
    deleteElement: (id: string) => Promise<DeleteResult>
}

export function ElementRowActions({ id, name, deleteElement }: Props) {
    const titleId = useId()
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)

    useEffect(() => {
        if (!confirmOpen) return
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !deleting && !error) setConfirmOpen(false)
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [confirmOpen, deleting])

    function openConfirm() {
        setError(null)
        setConfirmOpen(true)
    }

    function closeConfirm() {
        if (deleting) return
        setConfirmOpen(false)
        setError(null)
    }

    async function confirmDelete() {
        setError(null)
        setDeleting(true)
        try {
            const result = await deleteElement(id)
            if (!result.ok) {
                setError(result.error)
                return
            }
            setConfirmOpen(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <Link
                    href={`/admin/elements/${id}/edit`}
                    className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                    Editar
                </Link>
                <button
                    type="button"
                    disabled={deleting}
                    onClick={openConfirm}
                    className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
                >
                    Eliminar
                </button>
            </div>

            {confirmOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
                    role="presentation"
                    onPointerDown={(e) => {
                        if (e.target === e.currentTarget && !deleting && !error) closeConfirm()
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <h2
                            id={titleId}
                            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                        >
                            Eliminar elemento
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            ¿Seguro que quieres eliminar{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                «{name}»
                            </span>
                            ?
                        </p>
                        {error ? (
                            <p
                                role="alert"
                                className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                            >
                                {error}
                            </p>
                        ) : null}
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={closeConfirm}
                                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                {error ? "Cerrar" : "Cancelar"}
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => void confirmDelete()}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
