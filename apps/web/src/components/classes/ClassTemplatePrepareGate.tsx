"use client"

import { useCallback, useEffect, useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Role, Sport } from "@prisma/client"

import { prepareClassFromTemplateAction } from "@/app/actions/classes"
import { ClassCreateForm } from "@/components/classes/ClassCreateForm"
import type { ClassDraft } from "@/components/classes/class-draft-storage"
import { Button } from "@/components/ui/button"
import { FormActions } from "@/components/ui/FormActions"

export type ClassTemplateGateMeta = {
    sourceClassId: string
    sourceTitle: string
    foreignExerciseCount: number
}

type Viewer = {
    id: string
    role: Role
}

type Props = {
    sports: Sport[]
    returnTo: string | null
    /** Draft listo (sin ejercicios ajenos). Si hay ajenos, viene null. */
    readyDraft: ClassDraft | null
    template: ClassTemplateGateMeta | null
    viewer: Viewer
}

export function ClassTemplatePrepareGate({
    sports,
    returnTo,
    readyDraft,
    template,
    viewer,
}: Props) {
    const router = useRouter()
    const titleId = useId()
    const [draft, setDraft] = useState<ClassDraft | null>(readyDraft)
    const [confirmOpen, setConfirmOpen] = useState(
        () => readyDraft == null && template != null && template.foreignExerciseCount > 0,
    )
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const handleCancel = useCallback(() => {
        if (pending) return
        if (returnTo) {
            router.push(returnTo)
            return
        }
        router.back()
    }, [pending, returnTo, router])

    useEffect(() => {
        if (!confirmOpen) return
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !pending) handleCancel()
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [confirmOpen, pending, handleCancel])

    function handleConfirm() {
        if (!template) return
        setError(null)
        startTransition(async () => {
            const result = await prepareClassFromTemplateAction({
                sourceClassId: template.sourceClassId,
            })
            if (!result.ok) {
                setError(result.error)
                return
            }
            setDraft(result.data)
            setConfirmOpen(false)
        })
    }

    if (draft) {
        return (
            <ClassCreateForm
                sports={sports}
                initialDraft={draft}
                viewer={viewer}
            />
        )
    }

    if (!template || template.foreignExerciseCount === 0) {
        return (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Preparando formulario…
            </p>
        )
    }

    return (
        <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Esta plantilla incluye ejercicios de otros entrenadores. Confirmá para
                continuar.
            </p>

            {confirmOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
                    role="presentation"
                    onPointerDown={(e) => {
                        if (e.target === e.currentTarget && !pending) handleCancel()
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
                            Duplicar ejercicios de la plantilla
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Al continuar,{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {template.foreignExerciseCount === 1
                                    ? "1 ejercicio de esta clase se generará como propio"
                                    : `${template.foreignExerciseCount} ejercicios de esta clase se generarán como propios`}
                            </span>{" "}
                            para que puedas modificarlos. Los encontrarás en tu lista de
                            ejercicios.
                        </p>
                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                            La clase solo se agregará a tu lista cuando termines de prepararla
                            y pulses «Guardar clase».
                        </p>
                        {error ? (
                            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                                {error}
                            </p>
                        ) : null}
                        <FormActions
                            className="mt-6"
                            pending={pending}
                            onCancel={handleCancel}
                            cancelLabel="Cancelar"
                            submit={
                                <Button
                                    type="button"
                                    variant="primary"
                                    disabled={pending}
                                    onClick={() => handleConfirm()}
                                >
                                    {pending ? "Duplicando…" : "Continuar"}
                                </Button>
                            }
                        />
                    </div>
                </div>
            ) : null}
        </>
    )
}
