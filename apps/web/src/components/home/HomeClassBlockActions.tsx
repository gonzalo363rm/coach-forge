"use client"

import { useRouter } from "next/navigation"
import { useEffect, useId, useState, useTransition } from "react"

import { deleteTrainingClassAction } from "@/app/actions/classes"
import { Button, ButtonLink } from "@/components/ui/button"
import { FormActions } from "@/components/ui/FormActions"

type Props = {
    classId: string
    title: string
    startHref: string
    templateHref: string
    isOwn: boolean
}

export function HomeClassBlockActions({
    classId,
    title,
    startHref,
    templateHref,
    isOwn,
}: Props) {
    const router = useRouter()
    const titleId = useId()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    useEffect(() => {
        if (!confirmOpen) return
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !pending) setConfirmOpen(false)
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [confirmOpen, pending])

    function openConfirm() {
        setError(null)
        setConfirmOpen(true)
    }

    function closeConfirm() {
        if (pending) return
        setConfirmOpen(false)
        setError(null)
    }

    function confirmDelete() {
        setError(null)
        startTransition(async () => {
            const result = await deleteTrainingClassAction(classId)
            if (!result.ok) {
                setError(result.error)
                return
            }
            setConfirmOpen(false)
            router.refresh()
        })
    }

    return (
        <>
            <div className="flex shrink-0 flex-wrap gap-2">
                <ButtonLink href={startHref} variant="primary" size="sm">
                    Comenzar
                </ButtonLink>
                {isOwn ? (
                    <>
                        <ButtonLink href={`/classes/${classId}/edit`} variant="secondary" size="sm">
                            Editar
                        </ButtonLink>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={pending}
                            onClick={openConfirm}
                        >
                            Eliminar
                        </Button>
                    </>
                ) : null}
                <ButtonLink href={templateHref} variant="soft" size="sm">
                    Usar plantilla
                </ButtonLink>
            </div>

            {confirmOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
                    role="presentation"
                    onPointerDown={(event) => {
                        if (event.target === event.currentTarget && !pending) closeConfirm()
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <h2
                            id={titleId}
                            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                        >
                            Eliminar clase
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            ¿Seguro que quieres eliminar{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                «{title}»
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
                            pending={pending}
                            onCancel={closeConfirm}
                            submit={
                                <Button
                                    type="button"
                                    variant="danger"
                                    disabled={pending}
                                    onClick={() => void confirmDelete()}
                                >
                                    {pending ? "Eliminando…" : "Eliminar"}
                                </Button>
                            }
                        />
                    </div>
                </div>
            ) : null}
        </>
    )
}
