import { clsx } from "clsx"
import type { ReactNode } from "react"

import { Button, ButtonLink } from "@/components/ui/button"

type FormActionsProps = {
    pending?: boolean
    submitLabel?: string
    pendingLabel?: string
    cancelLabel?: string
    cancelHref?: string
    onCancel?: () => void
    /** Si el primary no es type=submit del form. */
    onSubmitClick?: () => void
    submitType?: "submit" | "button"
    submitDisabled?: boolean
    cancelDisabled?: boolean
    borderTop?: boolean
    className?: string
    /** Sustituye el botón primary (p. ej. texto custom). */
    submit?: ReactNode
}

export function FormActions({
    pending = false,
    submitLabel = "Guardar",
    pendingLabel = "Guardando…",
    cancelLabel = "Cancelar",
    cancelHref,
    onCancel,
    onSubmitClick,
    submitType = "submit",
    submitDisabled = false,
    cancelDisabled = false,
    borderTop = false,
    className,
    submit,
}: FormActionsProps) {
    const disabledCancel = cancelDisabled || pending

    return (
        <div
            className={clsx(
                "flex flex-wrap justify-end gap-3",
                borderTop && "border-t border-zinc-200 pt-6 dark:border-zinc-800",
                className,
            )}
        >
            {cancelHref ? (
                <ButtonLink
                    href={cancelHref}
                    variant="secondary"
                    aria-disabled={disabledCancel || undefined}
                    tabIndex={disabledCancel ? -1 : undefined}
                    className={disabledCancel ? "pointer-events-none opacity-50" : undefined}
                >
                    {cancelLabel}
                </ButtonLink>
            ) : (
                <Button
                    type="button"
                    variant="secondary"
                    disabled={disabledCancel}
                    onClick={onCancel}
                >
                    {cancelLabel}
                </Button>
            )}

            {submit ?? (
                <Button
                    type={submitType}
                    variant="primary"
                    disabled={pending || submitDisabled}
                    onClick={onSubmitClick}
                >
                    {pending ? pendingLabel : submitLabel}
                </Button>
            )}
        </div>
    )
}
