"use client"

import { Button } from "@/components/ui/button"

export type ResetConfirmModalProps = {
    open: boolean
    isTemplateExercise: boolean
    onClose: () => void
    onClearCanvas: () => void
    onResetTemplate: () => void
}

export const ResetConfirmModal = ({
    open,
    isTemplateExercise,
    onClose,
    onClearCanvas,
    onResetTemplate,
}: ResetConfirmModalProps) => {
    if (!open) return null

    return (
        <div
            className="cf-modal-backdrop"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="cf-modal-card cf-modal-card--md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-modal-title"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <h3 id="reset-modal-title" className="cf-modal-title">
                    Confirmar {isTemplateExercise ? "reset" : "clear"}
                </h3>
                <p className="cf-modal-text">
                    {isTemplateExercise
                        ? "Este ejercicio viene de template. Puedes limpiar el canvas o reiniciar el template."
                        : "Esto limpiara todo el canvas actual."}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        Cancelar
                    </Button>
                    {isTemplateExercise ? (
                        <Button type="button" variant="info" size="sm" onClick={onResetTemplate}>
                            Reiniciar template
                        </Button>
                    ) : null}
                    <Button type="button" variant="danger" size="sm" onClick={onClearCanvas}>
                        Limpiar canvas
                    </Button>
                </div>
            </div>
        </div>
    )
}
