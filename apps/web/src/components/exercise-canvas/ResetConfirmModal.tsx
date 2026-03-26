"use client"

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
                    <button type="button" onClick={onClose} className="cf-btn-neutral">
                        Cancelar
                    </button>
                    {isTemplateExercise && (
                        <button type="button" onClick={onResetTemplate} className="cf-btn-info">
                            Reiniciar template
                        </button>
                    )}
                    <button type="button" onClick={onClearCanvas} className="cf-btn-danger">
                        Limpiar canvas
                    </button>
                </div>
            </div>
        </div>
    )
}
