"use client"

import { useEffect, useId, useState } from "react"

import { Button, ButtonLink } from "@/components/ui/button"
import { FormActions } from "@/components/ui/FormActions"

type DeleteResult = { ok: true } | { ok: false; error: string }

type Props = {
    id: string
    displayName: string
    deleteMember: (id: string) => Promise<DeleteResult>
}

export function ClubMemberRowActions({ id, displayName, deleteMember }: Props) {
    const titleId = useId()
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)

    useEffect(() => {
        if (!confirmOpen) return
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !deleting) setConfirmOpen(false)
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
            const result = await deleteMember(id)
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
                <ButtonLink
                    href={`/club/members/${id}/edit`}
                    variant="secondary"
                    size="sm"
                >
                    Editar
                </ButtonLink>
                <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={deleting}
                    onClick={openConfirm}
                >
                    Eliminar
                </Button>
            </div>

            {confirmOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
                    role="presentation"
                    onPointerDown={(e) => {
                        if (e.target === e.currentTarget && !deleting) closeConfirm()
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
                            Eliminar coach
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            ¿Seguro que quieres eliminar a{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                «{displayName}»
                            </span>
                            ? Esta acción no se puede deshacer.
                        </p>
                        {error ? (
                            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                                {error}
                            </p>
                        ) : null}
                        <FormActions
                            className="mt-6"
                            pending={deleting}
                            onCancel={closeConfirm}
                            submit={
                                <Button
                                    type="button"
                                    variant="danger"
                                    disabled={deleting}
                                    onClick={() => void confirmDelete()}
                                >
                                    {deleting ? "Eliminando…" : "Eliminar"}
                                </Button>
                            }
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}
