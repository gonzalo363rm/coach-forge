import Link from "next/link"

type Props = {
    planName: string | null
}

export function UpgradePlanBanner({ planName }: Props) {
    return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        Mejorá tu plan
                    </p>
                    <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
                        {planName
                            ? `Estás en «${planName}». Pasá al plan Full para desbloquear todo.`
                            : "Desbloqueá más permisos con un plan superior."}
                    </p>
                </div>
                <Link
                    href="/plans"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                    Ver planes
                </Link>
            </div>
        </div>
    )
}
