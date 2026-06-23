import Link from "next/link"

type Props = {
    returnTo?: string | null
}

export function ExerciseEditorMobileUnavailable({ returnTo }: Props) {
    const backHref = returnTo?.trim() ? returnTo.trim() : "/exercises/mine"
    const backLabel = returnTo?.trim() ? "Volver" : "Ir a mis ejercicios"

    return (
        <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-100 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
                Funcionalidad no disponible en móvil
            </p>
            <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
                La creación y edición de ejercicios requiere una pantalla más grande. Usá una
                computadora o tablet en horizontal.
            </p>
            <Link
                href={backHref}
                className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
                ← {backLabel}
            </Link>
        </div>
    )
}
